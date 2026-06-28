// src/modules/audit/audit.controller.ts
// SADECE HTTP. Denetim kaydı yalnız audit.read (ADMIN) ile okunur.
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT.READ)
  list(@Query() q: QueryAuditDto) {
    return this.service.list({
      entity: q.entity,
      actorId: q.actorId,
      page: q.page,
      limit: q.limit,
      skip: q.skip,
    });
  }
}
