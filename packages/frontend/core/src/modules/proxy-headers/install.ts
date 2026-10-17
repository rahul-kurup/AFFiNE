import { browserProxyHeadersProvider } from './browser-provider';
import type { ProxyHeadersProvider } from './provider';
import type { ProxyHeaders } from './types';

let currentProvider: ProxyHeadersProvider = browserProxyHeadersProvider;
let installed = false;

export function setProxyHeadersProvider(provider: ProxyHeadersProvider) {
  currentProvider = provider;
}

export function getProxyHeadersProvider(): ProxyHeadersProvider {
  return currentProvider;
}

function headersRecord(headers: ProxyHeaders): Record<string, string> {
  const record: Record<string, string> = {};
  for (const header of headers) {
    const name = header.name.trim();
    if (name) {
      record[name] = header.value;
    }
  }
  return record;
}

function createProxyHeadersFetch(rawFetch: typeof globalThis.fetch) {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const headers = await currentProvider.get().catch(() => [] as ProxyHeaders);
    let request: Request;
    try {
      request = new Request(input, init);
    } catch {
      return rawFetch(input, init);
    }
    for (const [name, value] of Object.entries(headersRecord(headers))) {
      if (!request.headers.has(name)) {
        try {
          request.headers.set(name, value);
        } catch {
          // forbidden header name, skip
        }
      }
    }
    return rawFetch(request);
  };
}

function createProxyHeadersXMLHttpRequest(
  rawXMLHttpRequest: typeof XMLHttpRequest
) {
  return class extends rawXMLHttpRequest {
    override send(body?: Document | XMLHttpRequestBodyInit | null): void {
      currentProvider.get().then(
        headers => {
          for (const [name, value] of Object.entries(headersRecord(headers))) {
            try {
              super.setRequestHeader(name, value);
            } catch {
              // header already set by the caller, keep the caller value
            }
          }
          super.send(body);
        },
        () => {
          super.send(body);
        }
      );
    }
  };
}

// Native EventSource cannot send custom headers, so SSE connections are proxied
// through a fetch-backed implementation that applies the configured proxy
// headers. Supports the subset of the EventSource API used by AFFiNE:
// addEventListener (including named events), onopen/onmessage/onerror,
// readyState, close(), withCredentials and automatic reconnection.
class ProxyHeadersEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readonly url: string;
  readonly withCredentials: boolean;
  readyState = 0;
  onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;

  protected readonly provider: ProxyHeadersProvider;
  private abortController: AbortController | null = null;
  private closed = false;
  private lastEventId: string | null = null;
  private retryTime = 3000;
  private dataBuffer: string[] = [];
  private eventName = 'message';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    url: string | URL,
    eventSourceInitDict: EventSourceInit | undefined,
    provider: ProxyHeadersProvider
  ) {
    super();
    this.url =
      typeof url === 'string'
        ? new URL(url, globalThis.location?.href).href
        : url.href;
    this.withCredentials = eventSourceInitDict?.withCredentials ?? false;
    this.provider = provider;
    this.connect().catch(() => {});
  }

  private async connect() {
    if (this.closed || this.readyState === this.OPEN) return;
    this.readyState = this.CONNECTING;
    const controller = new AbortController();
    this.abortController = controller;
    try {
      const headers = headersRecord(await this.provider.get());
      if (this.closed) return;
      if (this.lastEventId) {
        headers['Last-Event-ID'] = this.lastEventId;
      }
      const response = await fetch(this.url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        credentials: this.withCredentials ? 'include' : 'same-origin',
      });
      if (this.closed || controller.signal.aborted) return;
      if (!response.ok || !response.body) {
        throw new Error(
          `EventSource request failed with status ${response.status}`
        );
      }
      this.readyState = this.OPEN;
      this.dispatchEvent(new Event('open'));
      await this.readStream(response.body.getReader());
      if (!this.closed) {
        this.scheduleReconnect();
      }
    } catch {
      if (!this.closed) {
        this.dispatchEvent(new Event('error'));
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return;
    this.readyState = this.CONNECTING;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, this.retryTime);
  }

  private async readStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).replace(/\r$/, '');
          buffer = buffer.slice(boundary + 1);
          this.parseLine(line);
          boundary = buffer.indexOf('\n');
        }
        if (this.closed) return;
      }
      if (buffer) {
        this.parseLine(buffer.replace(/\r$/, ''));
      }
      this.dispatchData();
    } finally {
      reader.releaseLock();
    }
  }

  private parseLine(line: string) {
    if (line === '') {
      this.dispatchData();
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    switch (field) {
      case 'data':
        this.dataBuffer.push(value);
        break;
      case 'event':
        this.eventName = value || 'message';
        break;
      case 'id':
        if (!value.includes('\0')) {
          this.lastEventId = value;
        }
        break;
      case 'retry': {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
          this.retryTime = parsed;
        }
        break;
      }
      default:
        break;
    }
  }

  private dispatchData() {
    if (this.dataBuffer.length === 0) {
      this.eventName = 'message';
      return;
    }
    const data = this.dataBuffer.join('\n');
    this.dataBuffer = [];
    const type = this.eventName;
    this.eventName = 'message';
    this.dispatchEvent(
      new MessageEvent(type, {
        data,
        lastEventId: this.lastEventId ?? '',
      })
    );
  }

  override dispatchEvent(event: Event): boolean {
    if (event.type === 'open') {
      this.readyState = this.OPEN;
      this.onopen?.call(this as unknown as EventSource, event);
    } else if (event.type === 'error') {
      this.onerror?.call(this as unknown as EventSource, event);
    } else if (event.type === 'message' && event instanceof MessageEvent) {
      this.onmessage?.call(this as unknown as EventSource, event);
    }
    return super.dispatchEvent(event);
  }

  close() {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
  }
}

/**
 * The server injects the proxy headers configured by the AFFiNE client into the
 * standalone admin console HTML as `window.__AFFINE_PROXY_HEADERS__`. Apply them
 * to the given provider on boot so cross-origin (admin) requests carry them too.
 *
 * Lives here (not in the barrel `index.ts`) so the worker, which imports this
 * module transitively via `bootstrap/browser`, does not pull in the editor UI.
 */
export function applyInjectedProxyHeaders(provider: ProxyHeadersProvider) {
  try {
    const injected = (globalThis as { __AFFINE_PROXY_HEADERS__?: unknown })
      .__AFFINE_PROXY_HEADERS__;
    if (Array.isArray(injected)) {
      void provider.set(injected as ProxyHeaders).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function installProxyHeadersProxy() {
  if (installed) return;
  installed = true;

  const rawFetch = globalThis.fetch;
  if (typeof rawFetch === 'function') {
    globalThis.fetch = createProxyHeadersFetch(rawFetch);
  }

  const rawXMLHttpRequest = globalThis.XMLHttpRequest;
  if (typeof rawXMLHttpRequest === 'function') {
    globalThis.XMLHttpRequest =
      createProxyHeadersXMLHttpRequest(rawXMLHttpRequest);
  }

  const RawEventSource = globalThis.EventSource;
  if (typeof RawEventSource === 'function') {
    globalThis.EventSource = class extends ProxyHeadersEventSource {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict, currentProvider);
      }
    } as unknown as typeof EventSource;
  }
}
