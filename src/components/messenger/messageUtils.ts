import type { Message } from './types';

export const OPTIMISTIC_MESSAGE_ID_BASE = 1_000_000_000_000;

export const isOptimisticMessage = (id: number) => id >= OPTIMISTIC_MESSAGE_ID_BASE;

export const isSameOutgoingMessage = (a: Message, b: Message) => {
  if (a.sender_type !== 'human' || b.sender_type !== 'human') return false;
  if (a.message_text !== b.message_text) return false;

  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return false;

  return Math.abs(aTime - bTime) < 15000;
};
