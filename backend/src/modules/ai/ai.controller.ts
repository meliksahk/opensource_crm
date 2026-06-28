// src/modules/ai/ai.controller.ts
// SADECE HTTP: DTO + yetki + servis çağrısı. Tümü ai.use izni gerektirir.
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AiService } from './ai.service';
import { DraftEmailDto, SummarizeDto } from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'AI etkin mi + model bilgisi' })
  status() {
    return this.ai.status();
  }

  @Post('deals/:id/score')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Fırsatı (deal) puanla ve sonraki adımları öner' })
  scoreDeal(@Param('id', ParseUUIDPipe) id: string) {
    return this.ai.scoreDeal(id);
  }

  @Post('draft-email')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Takip e-postası taslağı üret' })
  draftEmail(@Body() dto: DraftEmailDto) {
    return this.ai.draftEmail(dto);
  }

  @Post('summarize')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Serbest metni özetle' })
  summarize(@Body() dto: SummarizeDto) {
    return this.ai.summarize(dto);
  }
}
