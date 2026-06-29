'use client';
// app/(dashboard)/language/page.tsx — dil yönetimi: şablon indir + dil ekle/kaldır/seç.
import { useState } from 'react';
import { useI18n, Dict } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { Badge } from '@/components/atoms/Badge';

export default function LanguagePage() {
  const {
    t,
    lang,
    setLang,
    languages,
    addLanguage,
    removeLanguage,
    templateJson,
  } = useI18n();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Dict | null>(null);

  const download = () => {
    const blob = new Blob([templateJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm-language-template.en.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (file: File | undefined) => {
    setErr(null);
    setOk(null);
    setParsed(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const valid =
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          Object.values(obj).every((v) => typeof v === 'string');
        if (!valid) throw new Error('invalid');
        setParsed(obj as Dict);
        setOk(`${Object.keys(obj).length} anahtar okundu.`);
      } catch {
        setErr(t('lang.invalid'));
      }
    };
    reader.readAsText(file);
  };

  const add = () => {
    if (!code.trim() || !name.trim() || !parsed) return;
    addLanguage(code.trim().toLowerCase(), name.trim(), parsed);
    setLang(code.trim().toLowerCase());
    setCode('');
    setName('');
    setParsed(null);
    setOk(null);
  };

  const custom = languages.filter((l) => !l.builtin);

  return (
    <DashboardTemplate title={t('page.language')}>
      {/* Aktif dil */}
      <Card className="mb-4 p-4">
        <p className="mb-2 text-sm font-medium text-gray-600">
          {t('lang.current')}
        </p>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <Button
              key={l.code}
              variant={l.code === lang ? 'primary' : 'secondary'}
              className="text-sm"
              onClick={() => setLang(l.code)}
            >
              {l.name}
              {l.builtin && (
                <span className="ml-1 text-xs opacity-70">
                  ({t('lang.builtin')})
                </span>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Şablon + yeni dil ekle */}
      <Card className="mb-4 p-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">
          {t('lang.addTitle')}
        </p>
        <Button variant="secondary" onClick={download}>
          ⬇ {t('lang.downloadTemplate')}
        </Button>
        <p className="mt-2 text-xs text-gray-500">{t('lang.templateHint')}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="lang-code"
            label={t('lang.codeLabel')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <FormField
            id="lang-name"
            label={t('lang.nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            {t('lang.fileLabel')}
          </label>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="text-sm"
          />
        </div>
        {ok && <p className="mt-2 text-sm text-emerald-600">{ok}</p>}
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-3">
          <Button
            onClick={add}
            disabled={!code.trim() || !name.trim() || !parsed}
          >
            {t('lang.addButton')}
          </Button>
        </div>
      </Card>

      {/* Özel diller */}
      {custom.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            {t('lang.custom')}
          </p>
          <div className="space-y-2">
            {custom.map((l) => (
              <div
                key={l.code}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {l.name} <Badge tone="gray">{l.code}</Badge>
                </span>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => removeLanguage(l.code)}
                >
                  {t('lang.remove')}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardTemplate>
  );
}
