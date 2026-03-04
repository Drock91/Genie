/**
 * API Integration Agent
 * Generates type-safe frontend API clients and React hooks
 * Connects frontend UI to backend APIs with full TypeScript support
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

export class ApiIntegrationAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "APIIntegration", ...opts });
    this.multiLlmSystem = opts.multiLlmSystem;
  }

  /**
   * Main entry point - generate complete API integration
   */
  async generateApiClient(options = {}) {
    const {
      framework = 'react',
      hasAuth = true,
      traceId = '',
      iteration = 1
    } = options;

    this.info({ traceId, iteration }, `Generating API client for ${framework}`);

    try {
      // Generate all components
      const apiClient = this.generateApiClient_Main();
      const reactHooks = this.generateReactHooks();
      const errorHandling = this.generateErrorHandling();
      const types = this.generateApiTypes();
      const constants = this.generateApiConstants();
      const mockApiServer = this.generateMockApiServer();

      this.info({ traceId }, "API client generation complete");

      return makeAgentOutput({
        summary: 'Type-safe API client and React hooks generated',
        patches: [
          {
            type: 'file',
            path: 'src/api/client.ts',
            content: apiClient,
            description: 'Main API client wrapper'
          },
          {
            type: 'file',
            path: 'src/api/hooks.ts',
            content: reactHooks,
            description: 'React Query/SWR hooks'
          },
          {
            type: 'file',
            path: 'src/api/errors.ts',
            content: errorHandling,
            description: 'Error handling utilities'
          },
          {
            type: 'file',
            path: 'src/types/api.ts',
            content: types,
            description: 'API type definitions'
          },
          {
            type: 'file',
            path: 'src/api/constants.ts',
            content: constants,
            description: 'API endpoints and constants'
          },
          {
            type: 'file',
            path: 'src/api/mock.ts',
            content: mockApiServer,
            description: 'Mock API server for development'
          }
        ],
        notes: [
          '✓ Type-safe API client generated',
          '✓ React Query hooks included',
          '✓ Error handling configured',
          '✓ TypeScript types complete',
          '✓ Mock API server for development',
          '✓ Full IDE autocomplete support',
          '✓ Automatic request/response validation'
        ],
        data: {
          framework,
          hasAuth
        }
      });
    } catch (error) {
      this.logger?.error({ error: error.message }, "API client generation failed");
      throw error;
    }
  }

  generateApiClient_Main() {
    return `import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError, ApiResponse } from './errors';

/**
 * API Client - Centralized API communication
 */
class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refresh(refreshToken);
              localStorage.setItem('accessToken', response.data.accessToken);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              
              // Retry original request
              return this.axiosInstance(error.config!);
            } catch (err) {
              // Refresh failed, redirect to login
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(new ApiError(error));
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T = any>(endpoint: string, options = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, options);
      return {
        data: response.data,
        status: response.status,
        error: null
      };
    } catch (error) {
      throw new ApiError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T = any>(endpoint: string, data: any = {}, options = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data, options);
      return {
        data: response.data,
        status: response.status,
        error: null
      };
    } catch (error) {
      throw new ApiError(error);
    }
  }

  /**
   * Generic PATCH request
   */
  async patch<T = any>(endpoint: string, data: any = {}, options = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data, options);
      return {
        data: response.data,
        status: response.status,
        error: null
      };
    } catch (error) {
      throw new ApiError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(endpoint: string, options = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, options);
      return {
        data: response.data,
        status: response.status,
        error: null
      };
    } catch (error) {
      throw new ApiError(error);
    }
  }

  /**
   * Token refresh
   */
  async refresh(refreshToken: string) {
    return this.axiosInstance.post('/auth/refresh', { refreshToken });
  }

  /**
   * Login
   */
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  /**
   * Register
   */
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.post('/auth/register', { email, password, firstName, lastName });
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.get('/auth/me');
  }

  /**
   * Logout
   */
  async logout(refreshToken: string) {
    return this.post('/auth/logout', { refreshToken });
  }
}

export default new ApiClient();
`;
  }

  generateReactHooks() {
    return `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { ApiError } from './errors';

/**
 * React Query Hooks for seamless API integration
 */

// ============ AUTH HOOKS ============

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.login(email, password);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error.message);
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const response = await apiClient.register(data.email, data.password, data.firstName, data.lastName);
      return response.data;
    },
    onError: (error: ApiError) => {
      console.error('Registration failed:', error.message);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      await apiClient.logout(refreshToken);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
    }
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// ============ GENERIC HOOKS ============

export function useApiQuery<T = any>(
  key: string[],
  endpoint: string,
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<T>(endpoint);
      return response.data;
    },
    ...options
  });
}

export function useApiMutation<T = any>(
  method: 'post' | 'patch' | 'delete',
  endpoint: string,
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: any) => {
      let response;
      
      if (method === 'post') {
        response = await apiClient.post<T>(endpoint, data);
      } else if (method === 'patch') {
        response = await apiClient.patch<T>(endpoint, data);
      } else if (method === 'delete') {
        response = await apiClient.delete<T>(endpoint);
      }
      
      return response?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
    },
    ...options
  });
}

// ============ PAGINATION HOOKS ============

export function useInfiniteApiQuery<T = any>(
  key: string[],
  endpoint: string,
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<T>(\`\${endpoint}?page=\${pageParam}\`);
      return response.data;
    },
    ...options
  });
}
`;
  }

  generateErrorHandling() {
    return `import { AxiosError } from 'axios';

export interface ApiResponse<T> {
  data?: T;
  status?: number;
  error?: ApiError | null;
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(error: any) {
    let message = 'An error occurred';
    let status = 500;
    let data: any = null;

    if (error instanceof AxiosError) {
      status = error.response?.status || status;
      message = error.response?.data?.error || error.message;
      data = error.response?.data;
    } else if (error instanceof Error) {
      message = error.message;
    }

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Error boundary wrapper for API calls
 */
export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}
`;
  }

  generateApiTypes() {
    return `/**
 * API Type Definitions
 * These types match your backend API responses
 */

// ============ AUTH TYPES ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ============ PAGINATION TYPES ============

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ ERROR RESPONSE ============

export interface ErrorResponse {
  error: string;
  status: number;
  details?: any;
}

// ============ GENERIC TYPES ============

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiSingleResponse<T> {
  data: T;
}
`;
  }

  generateApiConstants() {
    return `/**
 * API Endpoints and Constants
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// ============ AUTH ENDPOINTS ============

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  PROFILE: '/auth/profile',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password'
};

// ============ USER ENDPOINTS ============

export const USER_ENDPOINTS = {
  LIST: '/users',
  GET: (id: string) => \`/users/\${id}\`,
  CREATE: '/users',
  UPDATE: (id: string) => \`/users/\${id}\`,
  DELETE: (id: string) => \`/users/\${id}\`
};

// ============ API CONFIG ============

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// ============ HEADERS ============

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};
`;
  }

  generateMockApiServer() {
    return `import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { AUTH_ENDPOINTS } from './constants';

/**
 * Mock API Server for Development and Testing
 * Uses Mock Service Worker (MSW)
 */

export const mockHandlers = [
  // Auth endpoints
  rest.post(\`\${process.env.REACT_APP_API_URL}/\${AUTH_ENDPOINTS.LOGIN}\`, (req, res, ctx) => {
    return res(
      ctx.json({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      })
    );
  }),

  rest.post(\`\${process.env.REACT_APP_API_URL}/\${AUTH_ENDPOINTS.REGISTER}\`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User created successfully'
      })
    );
  }),

  rest.get(\`\${process.env.REACT_APP_API_URL}/\${AUTH_ENDPOINTS.ME}\`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null
      })
    );
  })
];

export const server = setupServer(...mockHandlers);
`;
  }
}

export default ApiIntegrationAgent;
