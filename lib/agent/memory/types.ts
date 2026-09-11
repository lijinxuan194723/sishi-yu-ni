export type MemoryType =
  | 'profile'
  | 'preference'
  | 'boundary'
  | 'event'
  | 'relationship'
  | 'commitment'
  | 'unfinished'
  | 'habit';

export type AgentMemoryStatus = 'active' | 'resolved' | 'expired' | 'superseded';

export interface AgentMemory {
  id: string;
  type: MemoryType;
  content: string;
  createdAt: string;
  updatedAt: string;
  importance: number;
  confidence: number;
  sourceMessageIds: string[];
  lastAccessedAt?: string;
  expiresAt?: string;
  status: AgentMemoryStatus;
  supersedes?: string;
  tags: string[];
}

