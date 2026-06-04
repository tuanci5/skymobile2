const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`, { cache: 'no-store' }).then(handleResponse),
  post: (endpoint: string, data: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  put: (endpoint: string, data: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
  }).then(handleResponse),
};

// Specialized services
export const candidateService = {
  getAll: () => api.get('/api/candidates'),
  create: (data: any) => api.post('/api/candidates', data),
  updateStatus: (id: string, status: string) => api.put(`/api/candidates/${encodeURIComponent(id)}/status`, { status }),
  delete: (id: string) => api.delete(`/api/candidates/${id}`),
};

export const taskService = {
  getAll: (email: string, role: string) => api.get(`/api/tasks?email=${email}&role=${role}`),
  create: (data: any) => api.post('/api/tasks', data),
  update: (id: string, data: any) => api.put(`/api/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
  getSubtasks: (id: string) => api.get(`/api/tasks/${id}/subtasks`),
  createSubtask: (id: string, title: string) => api.post(`/api/tasks/${id}/subtasks`, { title }),
  updateSubtask: (id: string, data: any) => api.put(`/api/tasks/subtasks/${id}`, data),
  deleteSubtask: (id: string) => api.delete(`/api/tasks/subtasks/${id}`),
  getComments: (id: string) => api.get(`/api/tasks/${id}/comments`),
  addComment: (id: string, email: string, content: string) => api.post(`/api/tasks/${id}/comments`, { user_email: email, content }),
};

export const userService = {
  getAll: () => api.get('/api/users'),
  create: (data: any) => api.post('/api/users', data),
  update: (email: string, data: any) => api.put(`/api/users/${email}`, data),
  delete: (email: string) => api.delete(`/api/users/${email}`),
};

export const recruitmentService = {
  getPlans: () => api.get('/api/recruitment-plans'),
  createPlan: (data: any) => api.post('/api/recruitment-plans', data),
  updatePlan: (id: number, data: any) => api.put(`/api/recruitment-plans/${id}`, data),
  deletePlan: (id: number) => api.delete(`/api/recruitment-plans/${id}`),
};

export const roleService = {
  getPermissions: () => api.get('/api/role-permissions'),
  savePermissions: (role: string, allowed_tabs: string[]) => api.post('/api/role-permissions', { role, allowed_tabs }),
};

export const productService = {
  getAll: () => api.get('/api/products'),
  create: (data: any) => api.post('/api/products', data),
  update: (id: number, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: number) => api.delete(`/api/products/${id}`),
};

export const diagramService = {
  getPages: () => api.get('/api/diagrams/pages'),
  savePage: (page: any) => page.id ? api.post('/api/diagrams/pages', page) : api.post('/api/diagrams/pages', page),
  updatePage: (id: string, page: any) => api.put(`/api/diagrams/pages/${id}`, page),
  deletePage: (id: string) => api.delete(`/api/diagrams/pages/${id}`),
};

export const settingService = {
  getAll: () => api.get('/api/settings'),
  save: (settings: Record<string, string>) => api.post('/api/settings', settings),
};

export const aiService = {
  translate: (text: string, messageId?: number, targetLanguage?: string, sourceLanguage?: string) =>
    api.post('/api/ai/translate', { text, messageId, targetLanguage, sourceLanguage }),
  detectConversationLanguage: (conversationId: number) =>
    api.post('/api/ai/detect-conversation-language', { conversationId }),
  saveConversationLanguage: (conversationId: number, languageCode: string, languageLabel: string, source: 'manual' | 'detected' | 'fallback' = 'manual') =>
    api.put(`/api/fb/conversations/${conversationId}/preferred-language`, { languageCode, languageLabel, source }),
};
