import type { Framework } from '@toeverything/infra';

import { browserProxyHeadersProvider } from './browser-provider';
import { ProxyHeadersProvider } from './provider';
import { ProxyHeadersService } from './service';

export { browserProxyHeadersProvider } from './browser-provider';
export {
  applyInjectedProxyHeaders,
  installProxyHeadersProxy,
  setProxyHeadersProvider,
} from './install';
export { ProxyHeadersProvider } from './provider';
export { ProxyHeadersService } from './service';
export type { ProxyHeader, ProxyHeaders } from './types';
export { ProxyHeadersEditor } from './views/editor';

export const configureProxyHeadersModule = (framework: Framework) => {
  framework.service(ProxyHeadersService, container => {
    return new ProxyHeadersService(
      container.getOptional(ProxyHeadersProvider) ?? browserProxyHeadersProvider
    );
  });
};
