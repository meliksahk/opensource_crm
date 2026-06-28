// src/modules/leads/leads.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada. convert() tek transaction.
import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LeadCreateInput) {
    return this.prisma.lead.create({ data });
  }

  findById(id: string) {
    return this.prisma.lead.findFirst({ where: { id } });
  }

  async list(where: Prisma.LeadWhereInput, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  // Lead → Contact (+Company) + Deal (varsayılan pipeline, ilk stage). Tek transaction.
  // Tenant otomatik filtresi tx içinde de uygulanır (oluşturmalarda tenantId atanır).
  async convert(leadId: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id: leadId } });
      if (!lead) return { notFound: true as const };
      if (lead.status === LeadStatus.CONVERTED) {
        return { alreadyConverted: true as const };
      }

      const pipeline = await tx.pipeline.findFirst({
        where: { isDefault: true },
        include: { stages: { orderBy: { position: 'asc' }, take: 1 } },
      });
      if (!pipeline || !pipeline.stages[0]) {
        return { noPipeline: true as const };
      }
      const stage = pipeline.stages[0];
      const owner = lead.ownerId ?? actorId;

      let companyId: string | undefined;
      if (lead.companyName) {
        const company = await tx.company.create({
          data: { name: lead.companyName, ownerId: owner },
        });
        companyId = company.id;
      }

      const contact = await tx.contact.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          ownerId: owner,
          companyId,
        },
      });

      const max = await tx.deal.aggregate({
        where: { stageId: stage.id, deletedAt: null },
        _max: { rank: true },
      });
      const rank = (max._max.rank ? Number(max._max.rank) : 0) + 1;

      const deal = await tx.deal.create({
        data: {
          pipelineId: pipeline.id,
          stageId: stage.id,
          title: `${lead.firstName} ${lead.lastName}`,
          rank,
          ownerId: owner,
          contactId: contact.id,
          companyId,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedContactId: contact.id,
          convertedDealId: deal.id,
        },
      });

      return { lead: updatedLead, contact, deal };
    });
  }
}
