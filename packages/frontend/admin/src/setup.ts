import '@affine/core/bootstrap/browser';

import { browserProxyHeadersProvider } from '@affine/core/modules/proxy-headers/browser-provider';
import { applyInjectedProxyHeaders } from '@affine/core/modules/proxy-headers/install';

applyInjectedProxyHeaders(browserProxyHeadersProvider);
