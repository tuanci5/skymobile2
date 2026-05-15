import type { TabType } from '../types';

export const TAB_TO_PATH: Record<TabType, string> = {
  model: '/model',
  hr: '/hr',
  training: '/training',
  business: '/business',
  'action-plan': '/action-plan',
  products: '/products',
  users: '/users',
  tasks: '/tasks',
  messenger: '/messenger',
  revenue: '/revenue',
  settings: '/settings',
};

export const PATH_TO_TAB: Record<string, TabType> = {
  model: 'model',
  hr: 'hr',
  training: 'training',
  business: 'business',
  'action-plan': 'action-plan',
  products: 'products',
  users: 'users',
  tasks: 'tasks',
  messenger: 'messenger',
  revenue: 'revenue',
  settings: 'settings',
};
