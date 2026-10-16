// ORDER MATTERS
import './env';
import './public-path';
import './polyfill/browser';
import './telemetry';

import { installProxyHeadersProxy } from '../modules/proxy-headers/install';

installProxyHeadersProxy();
