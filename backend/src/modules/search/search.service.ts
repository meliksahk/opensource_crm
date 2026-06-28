// src/modules/search/search.service.ts
// İŞ MANTIĞI: Global arama (deals/contacts/companies). Sonuçlar aktörün izinlerine
// göre filtrelenir (deal.read/contact.read/company.read). Prisma parametrik → injection yok.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const TAKE = 10;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, actor: AuthenticatedUser) {
    const term = q.trim();
    const can = (p: string) => actor.permissions.includes(p);

    const [deals, contacts, companies] = await Promise.all([
      can(PERMISSIONS.DEAL.READ) ? this.deals(term) : Promise.resolve([]),
      can(PERMISSIONS.CONTACT.READ) ? this.contacts(term) : Promise.resolve([]),
      can(PERMISSIONS.COMPANY.READ)
        ? this.companies(term)
        : Promise.resolve([]),
    ]);

    return { query: term, deals, contacts, companies };
  }

  private async deals(q: string) {
    const rows = await this.prisma.deal.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, title: true, company: true, status: true },
    });
    return rows;
  }

  private async contacts(q: string) {
    return this.prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }

  private async companies(q: string) {
    return this.prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { domain: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, name: true, domain: true },
    });
  }
}
