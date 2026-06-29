'use client';
// src/components/organisms/RoleModal.tsx — rol oluştur/düzenle + izin seçici + sil.
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PERMISSION_GROUPS } from '@/lib/permissions';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export function RoleModal({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null; // null = yeni
  onClose: () => void;
  onSaved: () => void;
}) {
  const { can } = useAuth();
  const isNew = role === null;
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [perms, setPerms] = useState<string[]>(role?.permissions ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (p: string) =>
    setPerms((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const toggleGroup = (groupPerms: string[]) => {
    const allOn = groupPerms.every((p) => perms.includes(p));
    setPerms((s) =>
      allOn
        ? s.filter((p) => !groupPerms.includes(p))
        : [...new Set([...s, ...groupPerms])],
    );
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/roles', {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: perms,
        });
      } else {
        await api.patch(`/roles/${role.id}`, {
          description: description.trim() || undefined,
        });
        await api.patch(`/roles/${role.id}/permissions`, { permissions: perms });
      }
      onSaved();
      onClose();
    } catch {
      setErr('Kaydedilemedi — ad biçimi (BÜYÜK_HARF) ve yetki kontrolü.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!role) return;
    if (!confirm(`${role.name} rolü silinsin mi?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/roles/${role.id}`);
      onSaved();
      onClose();
    } catch {
      setErr('Silinemedi — role atanmış kullanıcılar olabilir.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? 'Yeni rol' : `Rol: ${role.name}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          id="r-name"
          label="Ad (BÜYÜK_HARF) *"
          placeholder="SUPPORT"
          value={name}
          disabled={!isNew}
          onChange={(e) => setName(e.target.value.toUpperCase())}
        />
        <FormField
          id="r-desc"
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <p className="mb-2 mt-4 text-sm font-medium text-gray-600">
        İzinler ({perms.length})
      </p>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border border-gray-100 p-3">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.group}>
            <button
              type="button"
              onClick={() => toggleGroup(g.perms)}
              className="mb-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              {g.group}
            </button>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {g.perms.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-1.5 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={perms.includes(p)}
                    onChange={() => toggle(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button disabled={busy || (isNew && !name.trim())} onClick={save}>
            {busy ? '…' : 'Kaydet'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
        {!isNew && can('role.delete') && (
          <Button variant="danger" disabled={busy} onClick={del}>
            Sil
          </Button>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </Modal>
  );
}
