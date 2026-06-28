// src/modules/automation/automation.engine.spec.ts
import { AutomationEngine, evaluateConditions } from './automation.engine';
import { AutomationRepository } from './automation.repository';
import { MailService } from '../integrations/mail/mail.service';

describe('evaluateConditions', () => {
  it('koşulsuz kural her zaman eşleşir', () => {
    expect(evaluateConditions(null, { status: 'WON' })).toBe(true);
  });
  it('eşleşen koşul → true', () => {
    expect(
      evaluateConditions({ field: 'status', equals: 'WON' }, { status: 'WON' }),
    ).toBe(true);
  });
  it('eşleşmeyen koşul → false', () => {
    expect(
      evaluateConditions(
        { field: 'status', equals: 'WON' },
        { status: 'OPEN' },
      ),
    ).toBe(false);
  });
});

describe('AutomationEngine.run', () => {
  let engine: AutomationEngine;
  let repo: { findActiveByTrigger: jest.Mock; createDealActivity: jest.Mock };
  let mail: { sendTemplate: jest.Mock };

  beforeEach(() => {
    repo = {
      findActiveByTrigger: jest.fn(),
      createDealActivity: jest.fn().mockResolvedValue({}),
    };
    mail = { sendTemplate: jest.fn().mockResolvedValue(undefined) };
    engine = new AutomationEngine(
      repo as unknown as AutomationRepository,
      mail as unknown as MailService,
    );
  });

  it('eşleşen kuralda create_activity çalışır', async () => {
    repo.findActiveByTrigger.mockResolvedValue([
      {
        id: 'r1',
        conditions: null,
        actions: [{ type: 'create_activity', note: 'Otomatik not' }],
      },
    ]);
    await engine.run('deal.created', { dealId: 'd1' });
    expect(repo.createDealActivity).toHaveBeenCalledWith(
      'd1',
      'automation',
      'Otomatik not',
    );
  });

  it('koşul eşleşmezse aksiyon çalışmaz', async () => {
    repo.findActiveByTrigger.mockResolvedValue([
      {
        id: 'r2',
        conditions: { field: 'status', equals: 'WON' },
        actions: [{ type: 'create_activity', note: 'x' }],
      },
    ]);
    await engine.run('deal.moved', { dealId: 'd1', status: 'OPEN' });
    expect(repo.createDealActivity).not.toHaveBeenCalled();
  });

  it('send_email aksiyonu MailService.sendTemplate çağırır', async () => {
    repo.findActiveByTrigger.mockResolvedValue([
      {
        id: 'r3',
        conditions: null,
        actions: [{ type: 'send_email', to: 'a@b.com', template: 'deal.won' }],
      },
    ]);
    await engine.run('invoice.paid', { number: 'INV-1' });
    expect(mail.sendTemplate).toHaveBeenCalledWith(
      'a@b.com',
      'deal.won',
      expect.objectContaining({ number: 'INV-1' }),
    );
  });
});
