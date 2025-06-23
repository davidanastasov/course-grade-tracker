import { apiClient } from '../lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/api';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', userData);
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/users/profile');
  }
};
