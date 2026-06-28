// src/modules/automation/automation.module.ts
import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';
import { AutomationEngine } from './automation.engine';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule], // MailService için
  controllers: [AutomationController],
  providers: [AutomationService, AutomationRepository, AutomationEngine],
  exports: [AutomationService],
})
export class AutomationModule {}
