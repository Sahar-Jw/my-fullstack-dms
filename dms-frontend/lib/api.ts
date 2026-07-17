
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('dms_token');
}

function flattenMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Something went wrong';
}

async function request<T>(
  path: string,
  options: RequestInit & { isFormData?: boolean } = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('dms_token');
      window.localStorage.removeItem('dms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let message = res.statusText;
    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      if (body?.message) message = flattenMessage(body.message);
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return res.blob() as unknown as Promise<T>;
}

function qs(params: Record<string, any> = {}): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  entries.forEach(([k, v]) => sp.set(k, String(v)));
  return `?${sp.toString()}`;
}

async function fetchFile(path: string): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('dms_token');
      window.localStorage.removeItem('dms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    throw new ApiError(res.status, 'File request failed');
  }

  return res;
}

export const api = {
  get: <T>(path: string, params?: Record<string, any>) =>
    request<T>(`${path}${qs(params)}`, { method: 'GET' }),

  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData, isFormData: true }),

  putForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'PUT', body: formData, isFormData: true }),

  // ✅ ADD THIS
  patchForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'PATCH', body: formData, isFormData: true }),

  async blobUrl(path: string) {
    const res = await fetchFile(path);
    const blob = await res.blob();
    return {
      url: window.URL.createObjectURL(blob),
      contentType: blob.type || res.headers.get('content-type') || '',
    };
  },

  async download(path: string, fallbackName = 'download') {
    const res = await fetchFile(path);
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : fallbackName;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { API_URL };

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}