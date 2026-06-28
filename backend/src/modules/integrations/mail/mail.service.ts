// src/modules/integrations/mail/mail.service.ts
// E-posta gönderimi: header injection temizliği + EmailLog. Sağlayıcıya arayüzle bağlı.
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IMailProvider,
  MAIL_PROVIDER,
  MailInput,
} from './mail-provider.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: IMailProvider,
    private readonly prisma: PrismaService,
  ) {}

  async send(input: MailInput): Promise<void> {
    // Mail header injection engeli (CRLF) — to/subject tek satır olmalı.
    this.assertNoCrlf(input.to, 'to');
    this.assertNoCrlf(input.subject, 'subject');

    try {
      await this.provider.send(input);
      await this.prisma.emailLog.create({
        data: {
          to: input.to,
          subject: input.subject,
          template: input.template,
          status: this.provider.driver === 'simulated' ? 'SIMULATED' : 'SENT',
        },
      });
    } catch (err) {
      await this.prisma.emailLog.create({
        data: {
          to: input.to,
          subject: input.subject,
          template: input.template,
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'unknown',
        },
      });
      throw err;
    }
  }

  private assertNoCrlf(value: string, field: string): void {
    if (/[\r\n]/.test(value)) {
      throw new BadRequestException(`${field}: geçersiz karakter (CRLF).`);
    }
  }
}
