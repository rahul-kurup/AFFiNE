import { SettingHeader } from '@affine/component/setting-components';
import { ProxyHeadersEditor } from '@affine/core/modules/proxy-headers';
import { useI18n } from '@affine/i18n';

export const ProxyHeadersSettings = () => {
  const t = useI18n();

  return (
    <>
      <SettingHeader
        title={t['com.affine.mobile.setting.proxy-headers.title']()}
        subtitle={t['com.affine.mobile.setting.proxy-headers.description']()}
      />
      <ProxyHeadersEditor />
    </>
  );
};
