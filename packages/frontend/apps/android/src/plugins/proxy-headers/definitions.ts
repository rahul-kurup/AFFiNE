export interface NativeProxyHeader {
  name: string;
  value: string;
}

export interface ProxyHeadersPlugin {
  /**
   * Returns the proxy headers currently known to the native network layer.
   */
  get(): Promise<{ headers: NativeProxyHeader[] }>;
  /**
   * Replaces the proxy headers used by the native network layer (OkHttp). This
   * is what makes native auth requests (sign-in / refresh / sign-out) carry the
   * configured headers just like WebView requests do.
   */
  set(options: { headers: NativeProxyHeader[] }): Promise<void>;
}
