// src/modules/reports/reports.controller.ts
import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('pipeline')
  @Permissions(PERMISSIONS.DEAL.READ)
  pipeline(@Query('pipelineId', ParseUUIDPipe) pipelineId: string) {
    return this.service.pipeline(pipelineId);
  }

  @Get('deals/summary')
  @Permissions(PERMISSIONS.DEAL.READ)
  dealsSummary() {
    return this.service.dealsSummary();
  }

  @Get('forecast')
  @Permissions(PERMISSIONS.DEAL.READ)
  forecast() {
    return this.service.forecast();
  }

  // Finansal özet yalnız invoice.read_financial ile.
  @Get('invoices/summary')
  @Permissions(PERMISSIONS.INVOICE.READ_FINANCIAL)
  invoicesSummary() {
    return this.service.invoicesSummary();
  }
}
