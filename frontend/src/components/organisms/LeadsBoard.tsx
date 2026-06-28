// src/components/organisms/LeadsBoard.tsx — Kanban panosu (stage sütunları + lead kartları).
import { Badge } from '../atoms/Badge';
import type { Board } from '@/types';

function stageTone(stage: { isWon: boolean; isLost: boolean }) {
  if (stage.isWon) return 'green' as const;
  if (stage.isLost) return 'red' as const;
  return 'blue' as const;
}

export function LeadsBoard({ board }: { board: Board }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {board.stages.map((stage) => (
        <div key={stage.id} className="w-72 flex-shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {stage.name}
            </h3>
            <Badge tone={stageTone(stage)}>{stage.leads.length}</Badge>
          </div>
          <div className="space-y-2">
            {stage.leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-900">
                  {lead.title}
                </p>
                {lead.company && (
                  <p className="text-xs text-gray-500">{lead.company}</p>
                )}
                {lead.value && (
                  <p className="mt-1 text-xs font-medium text-brand-700">
                    {lead.value} {lead.currency}
                  </p>
                )}
              </div>
            ))}
            {stage.leads.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
                boş
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
