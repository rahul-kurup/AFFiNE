import { Button, IconButton, Input } from '@affine/component';
import { DeleteIcon, PlusIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { ProxyHeadersService } from '../service';
import type { ProxyHeader } from '../types';
import * as styles from './editor.css';

type DraftHeader = ProxyHeader & { id: string };

let draftId = 0;
const nextId = () => String(++draftId);

const toDraft = (headers: ProxyHeader[]): DraftHeader[] =>
  headers.map(header => ({ ...header, id: nextId() }));

export interface ProxyHeadersEditorProps {
  onSaved?: () => void;
}

export const ProxyHeadersEditor = ({ onSaved }: ProxyHeadersEditorProps) => {
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
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }, [draft, service, onSaved]);

  return (
    <div className={styles.content}>
      <div className={styles.description}>
        Custom HTTP headers added to every request to your AFFiNE server, before
        and after sign in.
      </div>
      <div className={styles.list}>
        {draft.length === 0 ? (
          <div className={styles.empty}>No proxy headers configured.</div>
        ) : null}
        {draft.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemInputs}>
              <Input
                value={item.name}
                placeholder="Header name"
                onChange={value => updateItem(item.id, { name: value })}
              />
              <Input
                value={item.value}
                placeholder="Header value"
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
          Add header
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          loading={saving}
          onClick={() => {
            save().catch(console.error);
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
