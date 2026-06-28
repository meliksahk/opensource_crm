// src/common/tenant/tenant-context.ts
// İstek kapsamlı tenant bağlamı (AsyncLocalStorage). Prisma orta katmanı ve servisler
// mevcut tenantId'yi buradan okur → her sorguda elle taşımaya gerek yok.
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string | null;
}

const storage = new AsyncLocalStorage<TenantStore>();

export function runWithTenant<T>(tenantId: string | null, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

export function getCurrentTenantId(): string | null {
  return storage.getStore()?.tenantId ?? null;
}

// Tenant kapsamına alınan modeller (otomatik filtre uygulanır).
// PRAGMATİK SINIR: şimdilik yalnız Lead bu dikey dilimde kapsanıyor; diğer modeller
// (User/Invoice ...) aynı desenle kademeli eklenebilir (docs/06 §10).
export const TENANT_MODELS = new Set<string>(['Lead']);
