import { enableAutoTrack, sentry, tracker } from '@affine/track';
import { appSettingAtom } from '@toeverything/infra';
import { useAtomValue } from 'jotai/react';
import { useEffect } from 'react';

export function Telemetry() {
  const settings = useAtomValue(appSettingAtom);

  useEffect(() => {
    if (settings.enableTelemetry === true) {
      sentry.enable();
      tracker.opt_in_tracking();
      return enableAutoTrack(document.body, tracker.track);
    } else {
      sentry.disable();
      tracker.opt_out_tracking();
      return;
    }
  }, [settings.enableTelemetry]);

  return null;
}
