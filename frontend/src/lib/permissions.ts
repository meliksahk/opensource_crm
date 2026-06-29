// src/lib/permissions.ts
// İzin kataloğu (backend permission.enum.ts ile birebir; rol atama UI'ında kullanılır).
export const PERMISSION_GROUPS: { group: string; perms: string[] }[] = [
  { group: 'Kullanıcı', perms: ['user.create', 'user.read', 'user.update', 'user.delete'] },
  { group: 'Rol', perms: ['role.create', 'role.read', 'role.update', 'role.delete', 'role.assign'] },
  { group: 'Anlaşma', perms: ['deal.create', 'deal.read', 'deal.update', 'deal.delete', 'deal.move'] },
  { group: 'Lead', perms: ['lead.create', 'lead.read', 'lead.update', 'lead.delete', 'lead.convert'] },
  {
    group: 'Fatura',
    perms: ['invoice.create', 'invoice.read', 'invoice.update', 'invoice.delete', 'invoice.read_financial'],
  },
  { group: 'Entegrasyon', perms: ['integration.read', 'integration.manage'] },
  { group: 'Şirket', perms: ['company.create', 'company.read', 'company.update', 'company.delete'] },
  { group: 'Kişi', perms: ['contact.create', 'contact.read', 'contact.update', 'contact.delete'] },
  { group: 'Toplantı', perms: ['meeting.create', 'meeting.read', 'meeting.update', 'meeting.delete'] },
  { group: 'Otomasyon', perms: ['automation.read', 'automation.manage'] },
  { group: 'Özel alan', perms: ['custom_field.read', 'custom_field.manage'] },
  { group: 'AI', perms: ['ai.use'] },
  { group: 'Ürün', perms: ['product.create', 'product.read', 'product.update', 'product.delete'] },
  {
    group: 'Teklif',
    perms: ['quote.create', 'quote.read', 'quote.update', 'quote.delete', 'quote.send', 'quote.convert'],
  },
  { group: 'Veri', perms: ['data.export', 'data.import', 'data.merge'] },
  { group: 'Platform', perms: ['audit.read', 'gdpr.export', 'gdpr.erase', 'platform.tenant.manage'] },
];
