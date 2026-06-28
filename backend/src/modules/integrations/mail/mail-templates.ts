// src/modules/integrations/mail/mail-templates.ts
// Basit şablon kayıt defteri: anahtar → konu + gövde üreticisi. DRY + test edilebilir.
type Ctx = Record<string, unknown>;

interface Template {
  subject: (c: Ctx) => string;
  text: (c: Ctx) => string;
}

const s = (c: Ctx, k: string, d = ''): string =>
  c[k] === undefined || c[k] === null ? d : String(c[k]);

export const MAIL_TEMPLATES: Record<string, Template> = {
  welcome: {
    subject: () => 'Açık Kaynak CRM — Hoş geldiniz',
    text: (c) =>
      `Merhaba ${s(c, 'firstName', 'kullanıcı')},\n\nHesabınız oluşturuldu. İyi çalışmalar!`,
  },
  'deal.won': {
    subject: (c) => `Anlaşma kazanıldı: ${s(c, 'title')}`,
    text: (c) =>
      `Tebrikler! "${s(c, 'title')}" anlaşması kazanıldı (${s(c, 'value', '-')} ${s(c, 'currency', 'TRY')}).`,
  },
  'lead.assigned': {
    subject: () => 'Yeni lead atandı',
    text: (c) =>
      `Size yeni bir lead atandı: ${s(c, 'firstName')} ${s(c, 'lastName')} (${s(c, 'companyName', '-')}).`,
  },
  'invoice.issued': {
    subject: (c) => `Faturanız hazır: ${s(c, 'number')}`,
    text: (c) =>
      `${s(c, 'customerName')} için ${s(c, 'number')} numaralı fatura düzenlendi. Tutar: ${s(c, 'total', '-')} ${s(c, 'currency', 'TRY')}.`,
  },
};

export function renderTemplate(
  templateKey: string,
  context: Ctx,
): { subject: string; text: string } {
  const tpl = MAIL_TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Bilinmeyen mail şablonu: ${templateKey}`);
  }
  return { subject: tpl.subject(context), text: tpl.text(context) };
}
