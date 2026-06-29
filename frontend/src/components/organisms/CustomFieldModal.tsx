'use client';
// src/components/organisms/CustomFieldModal.tsx — özel alan tanımı oluştur/düzenle/sil.
import { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';

export interface FieldDef {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
}

const ENTITIES = ['DEAL', 'CONTACT', 'COMPANY', 'LEAD'];
const TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'];

export function CustomFieldModal({
  def,
  onClose,
  onSaved,
}: {
  def: FieldDef | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = def === null;
  const [entity, setEntity] = useState(def?.entity ?? 'DEAL');
  const [key, setKey] = useState(def?.key ?? '');
  const [label, setLabel] = useState(def?.label ?? '');
  const [type, setType] = useState(def?.type ?? 'TEXT');
  const [options, setOptions] = useState((def?.options ?? []).join('\n'));
  const [required, setRequired] = useState(def?.required ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const optionList = () =>
    options
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/custom-fields', {
          entity,
          key: key.trim(),
          label: label.trim(),
          type,
          options: type === 'SELECT' ? optionList() : [],
          required,
        });
      } else {
        await api.patch(`/custom-fields/${def.id}`, {
          label: label.trim(),
          options: def.type === 'SELECT' ? optionList() : [],
          required,
        });
      }
      onSaved();
      onClose();
    } catch {
      setErr('Kaydedilemedi — key biçimi (a-z0-9_) ya da çift kayıt olabilir.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!def) return;
    if (!confirm('Özel alan silinsin mi?')) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/custom-fields/${def.id}`);
      onSaved();
      onClose();
    } catch {
      setErr('Silinemedi.');
    } finally {
      setBusy(false);
    }
  };

  const showOptions = (isNew ? type : def?.type) === 'SELECT';

  return (
    <Modal title={isNew ? 'Yeni özel alan' : `Özel alan: ${def.key}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Varlık {isNew ? '*' : '(değişmez)'}
          </label>
          <select
            value={entity}
            disabled={!isNew}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
          >
            {ENTITIES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id="cf-key"
          label={`Anahtar ${isNew ? '*' : '(değişmez)'}`}
          placeholder="industry_segment"
          value={key}
          disabled={!isNew}
          onChange={(e) => setKey(e.target.value)}
        />
        <FormField
          id="cf-label"
          label="Etiket *"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Tip {isNew ? '*' : '(değişmez)'}
          </label>
          <select
            value={type}
            disabled={!isNew}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
          >
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showOptions && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            SELECT seçenekleri (her satır / virgül bir seçenek)
          </label>
          <Textarea
            rows={3}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={'SMB\nENTERPRISE'}
          />
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Zorunlu alan
      </label>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            disabled={busy || (isNew && (!key.trim() || !label.trim()))}
            onClick={save}
          >
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
