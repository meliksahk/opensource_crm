// src/modules/leads/leads.service.ts
// İŞ MANTIĞI: nitelenmemiş Lead CRUD + Contact/Deal'e dönüştürme.
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LeadsRepository } from './leads.repository';
import { CreateLeadDto, QueryLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly repo: LeadsRepository) {}

  async create(dto: CreateLeadDto, actor: AuthenticatedUser) {
    const lead = await this.repo.create({ ...dto, ownerId: actor.id });
    return lead;
  }

  async findAll(q: QueryLeadDto) {
    const where: Prisma.LeadWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.q) {
      where.OR = [
        { firstName: { contains: q.q, mode: 'insensitive' } },
        { lastName: { contains: q.q, mode: 'insensitive' } },
        { email: { contains: q.q, mode: 'insensitive' } },
        { companyName: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    const { items, total } = await this.repo.list(where, q.skip, q.limit);
    return { data: items, meta: { page: q.page, limit: q.limit, total } };
  }

  async findOne(id: string) {
    const lead = await this.repo.findById(id);
    if (!lead) throw new NotFoundException('Lead bulunamadı');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new ConflictException('Dönüştürülmüş lead düzenlenemez.');
    }
    // CONVERTED yalnız convert akışıyla atanır.
    if (dto.status === LeadStatus.CONVERTED) {
      throw new BadRequestException(
        'CONVERTED durumu yalnız dönüştürme ile atanır (POST /:id/convert).',
      );
    }
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }

  async convert(id: string, actor: AuthenticatedUser) {
    const result = await this.repo.convert(id, actor.id);
    if ('notFound' in result) {
      throw new NotFoundException('Lead bulunamadı');
    }
    if ('alreadyConverted' in result) {
      throw new ConflictException('Lead zaten dönüştürülmüş.');
    }
    if ('noPipeline' in result) {
      throw new BadRequestException(
        'Varsayılan pipeline bulunamadı (dönüştürme yapılamıyor).',
      );
    }
    this.logger.log(
      `lead.convert by=${actor.id} lead=${id} contact=${result.contact.id} deal=${result.deal.id}`,
    );
    return {
      lead: result.lead,
      contactId: result.contact.id,
      dealId: result.deal.id,
    };
  }
}
