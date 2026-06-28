// src/modules/automation/automation.engine.ts
// Domain olaylarını dinler → eşleşen otomasyon kurallarını çalıştırır (gevşek bağlılık).
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutomationRepository } from './automation.repository';
import { MailService } from '../integrations/mail/mail.service';

type Payload = Record<string, unknown>;
interface Condition {
  field: string;
  equals: string;
}
interface Action {
  type: string;
  note?: string;
  template?: string;
  to?: string;
}

// Saf: koşul payload ile eşleşiyor mu? (koşulsuz kural her zaman eşleşir)
export function evaluateConditions(
  conditions: Condition | null | undefined,
  payload: Payload,
): boolean {
  if (!conditions || !conditions.field) return true;
  return String(payload[conditions.field]) === String(conditions.equals);
}

@Injectable()
export class AutomationEngine {
  private readonly logger = new Logger(AutomationEngine.name);

  constructor(
    private readonly repo: AutomationRepository,
    private readonly mail: MailService,
  ) {}

  @OnEvent('deal.created')
  onDealCreated(p: Payload) {
    return this.run('deal.created', p);
  }
  @OnEvent('deal.moved')
  onDealMoved(p: Payload) {
    return this.run('deal.moved', p);
  }
  @OnEvent('lead.created')
  onLeadCreated(p: Payload) {
    return this.run('lead.created', p);
  }
  @OnEvent('invoice.paid')
  onInvoicePaid(p: Payload) {
    return this.run('invoice.paid', p);
  }
  @OnEvent('invoice.issued')
  onInvoiceIssued(p: Payload) {
    return this.run('invoice.issued', p);
  }

  async run(trigger: string, payload: Payload): Promise<void> {
    const rules = await this.repo.findActiveByTrigger(trigger);
    for (const rule of rules) {
      const conditions = rule.conditions as unknown as Condition | null;
      if (!evaluateConditions(conditions, payload)) continue;
      const actions = (rule.actions as unknown as Action[]) ?? [];
      for (const action of actions) {
        await this.execute(action, payload).catch((err) =>
          this.logger.warn(
            `kural ${rule.id} aksiyon ${action.type} hatası: ${
              err instanceof Error ? err.message : err
            }`,
          ),
        );
      }
    }
  }

  private async execute(action: Action, payload: Payload): Promise<void> {
    switch (action.type) {
      case 'create_activity': {
        const dealId = payload.dealId as string | undefined;
        if (dealId) {
          await this.repo.createDealActivity(
            dealId,
            'automation',
            action.note ?? 'Otomasyon notu',
          );
        }
        return;
      }
      case 'send_email': {
        if (action.to && action.template) {
          await this.mail.sendTemplate(action.to, action.template, payload);
        }
        return;
      }
      case 'log':
      default:
        this.logger.log(
          `automation: ${action.note ?? action.type} ${JSON.stringify(payload)}`,
        );
        return;
    }
  }
}
