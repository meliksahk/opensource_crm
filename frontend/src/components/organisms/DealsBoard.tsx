// src/components/organisms/DealsBoard.tsx — Kanban panosu (stage sütunları + deal kartları).
import { Badge } from '../atoms/Badge';
import type { Board } from '@/types';

function stageTone(stage: { isWon: boolean; isLost: boolean }) {
  if (stage.isWon) return 'green' as const;
  if (stage.isLost) return 'red' as const;
  return 'blue' as const;
}

export function DealsBoard({ board }: { board: Board }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {board.stages.map((stage) => (
        <div key={stage.id} className="w-72 flex-shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {stage.name}
            </h3>
            <Badge tone={stageTone(stage)}>{stage.deals.length}</Badge>
          </div>
          <div className="space-y-2">
            {stage.deals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-900">
                  {deal.title}
                </p>
                {deal.company && (
                  <p className="text-xs text-gray-500">{deal.company}</p>
                )}
                {deal.value && (
                  <p className="mt-1 text-xs font-medium text-brand-700">
                    {deal.value} {deal.currency}
                  </p>
                )}
              </div>
            ))}
            {stage.deals.length === 0 && (
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
