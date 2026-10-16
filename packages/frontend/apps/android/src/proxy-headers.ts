import {
  browserProxyHeadersProvider,
  type ProxyHeaders,
  type ProxyHeadersProvider,
  ProxyHeadersProvider as ProxyHeadersProviderId,
  setProxyHeadersProvider,
} from '@affine/core/modules/proxy-headers';
import type { Framework } from '@toeverything/infra';

import { ProxyHeaders as NativeProxyHeaders } from './plugins/proxy-headers';

/**
 * Mobile auth requests (sign-in / token refresh / sign-out) are performed by the
 * native Auth plugin over OkHttp, so they never pass through the WebView fetch
 * patches. This provider mirrors the configured headers to the native network
 * layer so those requests carry them too.
 *
 * It composes over the default browser provider so localStorage persistence and
 * BroadcastChannel syncing (used by the nbstore worker) keep working unchanged.
 */
class AndroidProxyHeadersProvider implements ProxyHeadersProvider {
  constructor(private readonly base: ProxyHeadersProvider) {}

  get(): Promise<ProxyHeaders> {
    return this.base.get();
  }

  async set(headers: ProxyHeaders): Promise<void> {
    await this.base.set(headers);
    await this.pushToNative(headers);
  }

  async sync(): Promise<void> {
    await this.pushToNative(await this.base.get());
  }

  private async pushToNative(headers: ProxyHeaders): Promise<void> {
    try {
      await NativeProxyHeaders.set({ headers });
    } catch (error) {
      console.error('Failed to sync proxy headers to native layer', error);
    }
  }
}

export function installAndroidProxyHeaders(framework: Framework) {
  const provider = new AndroidProxyHeadersProvider(browserProxyHeadersProvider);
  setProxyHeadersProvider(provider);
  framework.impl(ProxyHeadersProviderId, provider);
  provider.sync().catch(console.error);
  return provider;
}
