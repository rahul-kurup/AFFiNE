// ORDER MATTERS
import './env';
import './public-path';
import './polyfill/browser';
import './telemetry';

import { browserProxyHeadersProvider } from '../modules/proxy-headers/browser-provider';
import {
  applyInjectedProxyHeaders,
  installProxyHeadersProxy,
} from '../modules/proxy-headers/install';

installProxyHeadersProxy();
applyInjectedProxyHeaders(browserProxyHeadersProvider);
