const apiHost = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const BASE_URL = apiHost ? `${apiHost}/api` : '/api';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private accessToken: string | null = null;
  private currentWorkspaceId: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('keepr_access_token');
    this.currentWorkspaceId = localStorage.getItem('keepr_workspace_id');
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('keepr_access_token', token);
    } else {
      localStorage.removeItem('keepr_access_token');
    }
  }

  setCurrentWorkspaceId(id: string | null) {
    this.currentWorkspaceId = id;
    if (id) {
      localStorage.setItem('keepr_workspace_id', id);
    } else {
      localStorage.removeItem('keepr_workspace_id');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  getCurrentWorkspaceId() {
    return this.currentWorkspaceId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.currentWorkspaceId && !headers['x-workspace-id']) {
      headers['x-workspace-id'] = this.currentWorkspaceId;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
      const refreshToken = localStorage.getItem('keepr_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.data?.accessToken) {
            this.setAccessToken(refreshData.data.accessToken);
            headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
            const retryRes = await fetch(url, { ...options, headers });
            const retryData = await retryRes.json();
            if (!retryRes.ok) {
              throw retryData.error || { message: 'Request failed after token refresh' };
            }
            return retryData.data !== undefined ? retryData.data : retryData;
          }
        } catch {
          this.setAccessToken(null);
          localStorage.removeItem('keepr_refresh_token');
          window.location.href = '/login';
        }
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error?.message || data.message || `Request failed with status ${res.status}`;
      const err: ApiError = {
        message: errorMsg,
        code: data.error?.code,
        details: data.error?.details
      };
      throw err;
    }

    return data.data !== undefined ? data.data : data;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData
    });
  }
}

export const api = new ApiClient();
