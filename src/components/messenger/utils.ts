import type { Conversation } from './types';

export const getConversationAvatar = (conv: Conversation) => conv.avatarUrl || conv.customer_avatar || null;

export const formatNoteTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
