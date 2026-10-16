import type { ProxyHeadersProvider } from './provider';
import type { ProxyHeaders } from './types';

const STORAGE_KEY = 'affine-proxy-headers';
const CHANNEL_NAME = 'affine-proxy-headers';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function readLocalStorage(): ProxyHeaders {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProxyHeaders) : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(headers: ProxyHeaders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(headers));
  } catch {
    // ignore (private mode / quota)
  }
}

function createChannel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel === 'undefined') return null;
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

/**
 * Default provider for web, desktop and the mobile webview. Persists configured
 * headers in localStorage and keeps other contexts (notably the nbstore worker,
 * which cannot access localStorage) in sync over a BroadcastChannel.
 */
export class BrowserProxyHeadersProvider implements ProxyHeadersProvider {
  private cache: ProxyHeaders;
  private readonly channel: BroadcastChannel | null;
  private readonly hasStorage: boolean;

  constructor() {
    this.hasStorage = hasLocalStorage();
    this.cache = this.hasStorage ? readLocalStorage() : [];
    this.channel = createChannel();
    if (this.channel) {
      this.channel.addEventListener('message', this.onMessage);
      if (this.hasStorage) {
        this.broadcast();
      } else {
        this.channel.postMessage({ type: 'request' });
      }
    }
  }

  private readonly onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string; headers?: ProxyHeaders };
    if (data?.type === 'update' && Array.isArray(data.headers)) {
      this.cache = data.headers;
    } else if (data?.type === 'request' && this.hasStorage) {
      this.broadcast();
    }
  };

  private broadcast() {
    this.channel?.postMessage({ type: 'update', headers: this.cache });
  }

  get(): Promise<ProxyHeaders> {
    return Promise.resolve(this.cache);
  }

  set(headers: ProxyHeaders): Promise<void> {
    this.cache = headers;
    if (this.hasStorage) {
      writeLocalStorage(headers);
    }
    this.broadcast();
    return Promise.resolve();
  }
}

export const browserProxyHeadersProvider = new BrowserProxyHeadersProvider();
