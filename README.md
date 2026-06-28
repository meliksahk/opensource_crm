# Açık Kaynak CRM

Kurumsal düzeyde, ölçeklenebilir, yüksek güvenlikli, çoklu rol destekli (RBAC) ve
**API-First** açık kaynak CRM sistemi.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend | NestJS · PostgreSQL · Prisma · JWT · bcrypt · class-validator |
| Frontend (Faz 3+) | Next.js (App Router) · TypeScript · Tailwind · Atomic Design |
| DevOps (Faz 6) | Docker · docker-compose |

Mimari ilkeler: **API-First**, katmanlı mimari (`Controller → Service → Repository`),
secure-by-default, DRY/SOLID. Detaylar: [`docs/`](./docs).

## Yol Haritası (6 Faz)

| Faz | Kapsam | Durum |
|-----|--------|-------|
| 1 | Temel Mimari + Prisma Şeması + JWT Kimlik Doğrulama | ✅ |
| 2 | RBAC Guard'ları + Kullanıcı Yönetimi | ✅ |
| 3 | Satış (Lead) Modülü + Kanban | ✅ |
| 4 | Finans & Fatura (izole yetkiler) | ✅ |
| 5 | Dış Entegrasyonlar (Webhook, SMTP) | ✅ |
| 6 | Dockerization + Multi-tenancy | ✅ |

## Hızlı Başlangıç (Backend)

### Seçenek A — Tüm yığını Docker ile çalıştır (prod-benzeri)

```bash
cp .env.example .env           # KÖK .env: POSTGRES_* + JWT secret'ları doldur
docker compose up -d --build   # db (iç ağ) + backend (:3000) + mailhog (:8025)
# Backend başlangıçta migration'ları otomatik uygular. Sağlık: /api/v1/health
```

### Seçenek B — Backend'i lokalde, sadece DB'yi Docker'da çalıştır

```bash
# Yalnız veritabanı (dev override DB portunu 5432'de açar)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db

cd backend
cp .env.example .env           # DATABASE_URL → localhost:5432
npm install
npx prisma migrate dev         # şemayı oluştur
npm run seed                   # ADMIN rolü + admin kullanıcı + pipeline
npm run start:dev              # http://localhost:3000  (Swagger: /api/docs)
```

> Prod compose'da **DB portu host'a açılmaz** (yalnız iç ağ — güvenlik). Konteynerler
> root olmayan kullanıcıyla çalışır. Sırlar `.env`'dedir; imaja gömülmez.

### Gereksinimler
- Node.js ≥ 20 · Docker + Docker Compose
- (Lokal kurulumda) PostgreSQL ≥ 14, ya da `docker compose` ile gelen Postgres 16

## Komutlar (backend)

| Komut | Açıklama |
|-------|----------|
| `npm run start:dev` | Geliştirme (watch) |
| `npm run build` | Production derleme |
| `npm run lint` | ESLint |
| `npm run test` | Birim testleri |
| `npm run test:e2e` | E2E testleri |
| `npm run test:cov` | Kapsam raporu |

## Dokümantasyon

- [Mimari Genel Bakış](./docs/00-mimari-genel-bakis.md)
- [Faz dokümanları (01–06)](./docs)
- [Güvenlik Standartları](./docs/90-guvenlik-standartlari.md)
- [Test Stratejisi](./docs/91-test-stratejisi.md)
- [Katkı Rehberi](./CONTRIBUTING.md)

## Katkı

Katkılar memnuniyetle karşılanır. Lütfen [CONTRIBUTING.md](./CONTRIBUTING.md) ve
fazların kabul kriterlerini izleyin. Her PR: lint + test + güvenlik (negatif) testleri yeşil olmalı.

## Lisans

[MIT](./LICENSE)
