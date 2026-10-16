import { registerPlugin } from '@capacitor/core';

import type { ProxyHeadersPlugin } from './definitions';

export const ProxyHeaders = registerPlugin<ProxyHeadersPlugin>('ProxyHeaders');

export * from './definitions';
