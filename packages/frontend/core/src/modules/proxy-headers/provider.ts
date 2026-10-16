import { createIdentifier } from '@toeverything/infra';

import type { ProxyHeaders } from './types';

export interface ProxyHeadersProvider {
  get(): Promise<ProxyHeaders>;
  set(headers: ProxyHeaders): Promise<void>;
}

export const ProxyHeadersProvider = createIdentifier<ProxyHeadersProvider>(
  'ProxyHeadersProvider'
);
