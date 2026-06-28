// src/modules/integrations/integration-events.ts
// Desteklenen domain olayları (abonelik + yayınlama bunlarla sınırlı).
export const SUPPORTED_EVENTS = [
  'lead.created',
  'lead.moved',
  'invoice.issued',
  'invoice.paid',
] as const;

export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];
