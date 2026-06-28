// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { DealsModule } from '../deals/deals.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { aiClientProvider } from './ai.client';

@Module({
  imports: [DealsModule], // deal puanlama için DealsService
  controllers: [AiController],
  providers: [aiClientProvider, AiService],
  exports: [AiService],
})
export class AiModule {}
