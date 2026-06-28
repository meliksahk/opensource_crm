// src/modules/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationsRepository } from './integrations.repository';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { WebhookEventHandler } from './webhook-event.handler';
import { MailService } from './mail/mail.service';
import { MAIL_PROVIDER } from './mail/mail-provider.interface';
import { SimulatedMailProvider } from './mail/providers/simulated-mail.provider';
import { HTTP_CLIENT } from './http/http-client.interface';
import { FetchHttpClient } from './http/fetch-http.client';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    IntegrationsRepository,
    WebhookDispatcherService,
    WebhookEventHandler,
    MailService,
    // Sağlayıcı seçimi MAIL_DRIVER ile; şimdilik simulated (smtp ileride).
    { provide: MAIL_PROVIDER, useClass: SimulatedMailProvider },
    { provide: HTTP_CLIENT, useClass: FetchHttpClient },
  ],
  exports: [IntegrationsService, MailService],
})
export class IntegrationsModule {}
