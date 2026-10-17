import { Injectable } from '@nestjs/common';

import { Models } from '../../models';
import type { ProxyHeaders } from './types';

const PROXY_HEADERS_CONFIG_KEY = 'client.proxyHeaders';

@Injectable()
export class ProxyHeadersService {
  constructor(private readonly models: Models) {}

  async get(): Promise<ProxyHeaders> {
    const config = await this.models.appConfig.get(PROXY_HEADERS_CONFIG_KEY);
    if (!config?.value) {
      return [];
    }
    const value = config.value as unknown;
    if (Array.isArray(value)) {
      return value as ProxyHeaders;
    }
    return [];
  }

  async set(headers: ProxyHeaders): Promise<void> {
    const cleaned: ProxyHeaders = Array.isArray(headers)
      ? headers
          .filter(
            h => h && typeof h.name === 'string' && typeof h.value === 'string'
          )
          .map(h => ({ name: h.name.trim(), value: h.value }))
          .filter(h => h.name.length > 0)
      : [];
    await this.models.appConfig.createIfAbsent(
      PROXY_HEADERS_CONFIG_KEY,
      cleaned as any
    );
    await this.models.appConfig.mutate(
      PROXY_HEADERS_CONFIG_KEY,
      null as any,
      () => cleaned as any
    );
  }
}
