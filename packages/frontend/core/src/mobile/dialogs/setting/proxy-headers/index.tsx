import { Button, IconButton, Input, notify } from '@affine/component';
import {
  type ProxyHeader,
  ProxyHeadersService,
} from '@affine/core/modules/proxy-headers';
import { UserFriendlyError } from '@affine/error';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, PlusIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { SettingGroup } from '../group';
import { RowLayout } from '../row.layout';
import { SwipeDialog } from '../swipe-dialog';
import * as styles from './styles.css';

type DraftHeader = ProxyHeader & { id: string };

let draftId = 0;
const nextId = () => String(++draftId);

const toDraft = (headers: ProxyHeader[]): DraftHeader[] =>
  headers.map(header => ({ ...header, id: nextId() }));

export const ProxyHeadersGroup = () => {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const title = t['com.affine.mobile.setting.proxy-headers.title']();

  return (
    <>
      <SettingGroup
        title={t['com.affine.mobile.setting.proxy-headers.group']()}
      >
        <RowLayout label={title} onClick={() => setOpen(true)} />
      </SettingGroup>
      <SwipeDialog open={open} onOpenChange={setOpen} title={title}>
        <ProxyHeadersEditor />
      </SwipeDialog>
    </>
  );
};

const ProxyHeadersEditor = () => {
  const t = useI18n();
  const service = useService(ProxyHeadersService);
  const headers = useLiveData(service.headers$);
  const [draft, setDraft] = useState<DraftHeader[]>(() => toDraft(headers));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    service.load().catch(console.error);
  }, [service]);

  useEffect(() => {
    setDraft(toDraft(headers));
  }, [headers]);

  const updateItem = useCallback((id: string, patch: Partial<ProxyHeader>) => {
    setDraft(items =>
      items.map(item => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraft(items => items.filter(item => item.id !== id));
  }, []);

  const addItem = useCallback(() => {
    setDraft(items => [...items, { id: nextId(), name: '', value: '' }]);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const cleaned = draft
        .map(({ name, value }) => ({ name: name.trim(), value }))
        .filter(header => header.name.length > 0);
      await service.update(cleaned);
      notify.success({
        title: t['com.affine.mobile.setting.proxy-headers.saved'](),
      });
    } catch (error) {
      console.error(error);
      notify.error(UserFriendlyError.fromAny(error));
    } finally {
      setSaving(false);
    }
  }, [draft, service, t]);

  return (
    <div className={styles.content}>
      <div className={styles.description}>
        {t['com.affine.mobile.setting.proxy-headers.description']()}
      </div>
      <div className={styles.list}>
        {draft.length === 0 ? (
          <div className={styles.empty}>
            {t['com.affine.mobile.setting.proxy-headers.empty']()}
          </div>
        ) : null}
        {draft.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemInputs}>
              <Input
                value={item.name}
                placeholder={t[
                  'com.affine.mobile.setting.proxy-headers.name-placeholder'
                ]()}
                onChange={value => updateItem(item.id, { name: value })}
              />
              <Input
                value={item.value}
                placeholder={t[
                  'com.affine.mobile.setting.proxy-headers.value-placeholder'
                ]()}
                onChange={value => updateItem(item.id, { value })}
              />
            </div>
            <IconButton
              icon={<DeleteIcon />}
              onClick={() => removeItem(item.id)}
              size={24}
            />
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          prefix={<PlusIcon />}
          onClick={addItem}
        >
          {t['com.affine.mobile.setting.proxy-headers.add']()}
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          loading={saving}
          onClick={() => {
            save().catch(console.error);
          }}
        >
          {t['Save']()}
        </Button>
      </div>
    </div>
  );
};
