// src/types/index.ts — paylaşılan API tipleri (backend sözleşmesi).
export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; roles: string[] };
}

export interface Deal {
  id: string;
  title: string;
  contactName: string | null;
  company: string | null;
  value: string | null;
  currency: string;
  status: 'OPEN' | 'WON' | 'LOST';
  stageId: string;
  rank: string;
}

export interface BoardStage {
  id: string;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  deals: Deal[];
}

export interface Board {
  pipelineId: string;
  stages: BoardStage[];
}

export interface Invoice {
  id: string;
  number: string | null;
  customerName: string;
  status: string;
  currency: string;
  // finansal (yalnız invoice.read_financial ile gelir)
  total?: string;
  amountPaid?: string;
  subtotal?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}
