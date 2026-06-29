'use client';
// src/components/organisms/AutomationRuleModal.tsx — otomasyon kuralı oluştur/düzenle/sil.
import { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';

export interface RuleAction {
  type: 'create_activity' | 'send_email' | 'log';
  note?: string;
  template?: string;
  to?: string;
}
export interface Rule {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  conditions: { field: string; equals: string } | null;
  actions: RuleAction[];
}

const TRIGGERS = [
  'deal.created',
  'deal.moved',
  'lead.created',
  'invoice.paid',
  'invoice.issued',
];
const ACTION_TYPES: RuleAction['type'][] = ['create_activity', 'send_email', 'log'];

export function AutomationRuleModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: Rule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = rule === null;
  const [name, setName] = useState(rule?.name ?? '');
  const [trigger, setTrigger] = useState(rule?.trigger ?? TRIGGERS[0]);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [condField, setCondField] = useState(rule?.conditions?.field ?? '');
  const [condEquals, setCondEquals] = useState(rule?.conditions?.equals ?? '');
  const [actions, setActions] = useState<RuleAction[]>(
    rule?.actions?.length ? rule.actions : [{ type: 'create_activity', note: '' }],
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setAction = (i: number, patch: Partial<RuleAction>) =>
    setActions(actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const buildActions = () =>
    actions.map((a) => {
      if (a.type === 'send_email')
        return { type: a.type, template: a.template || undefined, to: a.to || undefined };
      return { type: a.type, note: a.note || undefined };
    });

  const conditions = () =>
    condField.trim() && condEquals.trim()
      ? { field: condField.trim(), equals: condEquals.trim() }
      : undefined;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/automation/rules', {
          name: name.trim(),
          trigger,
          conditions: conditions(),
          actions: buildActions(),
        });
      } else {
        await api.patch(`/automation/rules/${rule.id}`, {
          isActive,
          conditions: conditions(),
          actions: buildActions(),
        });
      }
      onSaved();
      onClose();
    } catch {
      setErr('Kaydedilemedi — en az bir eylem gerekli, alanları kontrol edin.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!rule) return;
    if (!confirm('Kural silinsin mi?')) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/automation/rules/${rule.id}`);
      onSaved();
      onClose();
    } catch {
      setErr('Silinemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? 'Yeni otomasyon kuralı' : `Kural: ${rule.name}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          id="ar-name"
          label={`Ad ${isNew ? '*' : '(değişmez)'}`}
          value={name}
          disabled={!isNew}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Tetikleyici {isNew ? '*' : '(değişmez)'}
          </label>
          <select
            value={trigger}
            disabled={!isNew}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
          >
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isNew && (
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif
        </label>
      )}

      <p className="mb-1 mt-4 text-sm font-medium text-gray-600">
        Koşul (opsiyonel) — payload alanı = değer
      </p>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          id="ar-cf"
          label="Alan"
          placeholder="status"
          value={condField}
          onChange={(e) => setCondField(e.target.value)}
        />
        <FormField
          id="ar-ce"
          label="Eşittir"
          placeholder="WON"
          value={condEquals}
          onChange={(e) => setCondEquals(e.target.value)}
        />
      </div>

      <p className="mb-1 mt-4 text-sm font-medium text-gray-600">Eylemler</p>
      {actions.map((a, i) => (
        <div key={i} className="mb-2 rounded-md border border-gray-100 p-2">
          <div className="flex items-center gap-2">
            <select
              value={a.type}
              onChange={(e) =>
                setAction(i, { type: e.target.value as RuleAction['type'] })
              }
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {actions.length > 1 && (
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => setActions(actions.filter((_, idx) => idx !== i))}
              >
                Kaldır
              </Button>
            )}
          </div>
          {a.type === 'send_email' ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Şablon (ör. welcome)"
                value={a.template ?? ''}
                onChange={(e) => setAction(i, { template: e.target.value })}
              />
              <input
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Alıcı e-posta"
                value={a.to ?? ''}
                onChange={(e) => setAction(i, { to: e.target.value })}
              />
            </div>
          ) : (
            <input
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="Not"
              value={a.note ?? ''}
              onChange={(e) => setAction(i, { note: e.target.value })}
            />
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        className="text-xs"
        onClick={() => setActions([...actions, { type: 'log', note: '' }])}
      >
        + Eylem
      </Button>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button disabled={busy || (isNew && !name.trim())} onClick={save}>
            {busy ? '…' : 'Kaydet'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
        {!isNew && (
          <Button variant="danger" disabled={busy} onClick={del}>
            Sil
          </Button>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </Modal>
  );
}
