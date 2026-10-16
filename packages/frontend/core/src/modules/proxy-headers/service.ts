import { LiveData, Service } from '@toeverything/infra';

import { browserProxyHeadersProvider } from './browser-provider';
import type { ProxyHeadersProvider } from './provider';
import type { ProxyHeaders } from './types';

export class ProxyHeadersService extends Service {
  readonly headers$ = new LiveData<ProxyHeaders>([]);

  private loadRequest: Promise<ProxyHeaders> | null = null;

  constructor(
    private readonly provider: ProxyHeadersProvider = browserProxyHeadersProvider
  ) {
    super();
  }

  async load() {
    if (!this.loadRequest) {
      this.loadRequest = this.provider.get().then(
        headers => {
          this.headers$.next(headers);
          return headers;
        },
        error => {
          this.loadRequest = null;
          throw error;
        }
      );
    }
    return this.loadRequest;
  }

  async update(headers: ProxyHeaders) {
    this.headers$.next(headers);
    this.loadRequest = Promise.resolve(headers);
    await this.provider.set(headers);
  }
}
