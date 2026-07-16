import { fetchApi } from './apiClient';

export const authApi = {
  login: async (dto: any) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
  register: async (dto: any) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
