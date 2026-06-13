import { DataProvider, fetchUtils } from 'react-admin';
import type { GetListParams, GetListResult, RaRecord, QueryFunctionContext } from 'react-admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const httpClient = (url: string, options?: RequestInit) => {
  const request: RequestInit & { headers?: HeadersInit } = { ...options };
  const headers = new Headers(request.headers || { Accept: 'application/json' });

  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) {
    headers.set('X-Tenant-ID', tenantId);
  }

  const method = (request.method || 'GET').toUpperCase();
  if (method !== 'GET' && request.body && !(request.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetchUtils.fetchJson(url, { ...request, headers });
};

const getCurrentUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to parse current user from storage', error);
    return null;
  }
};

const isAdminUser = () => {
  const role = getCurrentUser()?.role;
  return role === 'ADMIN' || role === 'COMPLIANCE';
};

const appendFilters = (searchParams: URLSearchParams, filters: Record<string, unknown> = {}) => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else if (value instanceof Date) {
      searchParams.set(key, value.toISOString());
    } else {
      searchParams.set(key, typeof value === 'boolean' ? String(value) : String(value));
    }
  });
};

const parseListResponse = (json: unknown, headers?: Headers) => {
  let data: unknown[] = [];
  if (Array.isArray(json)) {
    data = json as unknown[];
  } else if (typeof json === 'object' && json !== null) {
    const maybeObj = json as Record<string, unknown>;
    if ('data' in maybeObj && Array.isArray(maybeObj.data)) {
      data = maybeObj.data as unknown[];
    } else {
      data = [json];
    }
  } else if (json) {
    data = [json];
  }

  let total: number | undefined;
  if (headers) {
    const totalHeader = headers.get('x-total-count');
    if (totalHeader) {
      total = parseInt(totalHeader, 10);
    } else {
      const contentRange = headers.get('content-range');
      if (contentRange) {
        const [, rangeTotal] = contentRange.split('/');
        if (rangeTotal) {
          total = parseInt(rangeTotal, 10);
        }
      }
    }
  }

  if ((total === undefined || Number.isNaN(total)) && typeof json === 'object' && json !== null) {
    const maybeObj = json as Record<string, unknown>;
    if ('total' in maybeObj && typeof maybeObj.total === 'number') {
      total = maybeObj.total as number;
    }
  }

  if (total === undefined || Number.isNaN(total)) {
    total = data.length;
  }

  return { data, total };
};

const provider: DataProvider = {
  getList: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetListParams & QueryFunctionContext,
  ): Promise<GetListResult<RecordType>> => {
    const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
    const searchParams = new URLSearchParams();

    searchParams.set('skip', String((page - 1) * perPage));
    searchParams.set('take', String(perPage));

    appendFilters(searchParams, params.filter ?? {});

    if (isAdminUser() && (resource === 'accounts' || resource === 'transactions' || resource === 'loans')) {
      searchParams.set('scope', 'admin');
    }

    const queryString = searchParams.toString();
    const url = `${API_URL}/${resource}${queryString ? `?${queryString}` : ''}`;
    const { json, headers } = await httpClient(url);
    const { data, total } = parseListResponse(json, headers);
    return { data: data as unknown as RecordType[], total };
  },

  getOne: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const { json } = await httpClient(url);
    return { data: json };
  },

  getMany: async (resource, params) => {
    if (!params.ids?.length) {
      return { data: [] };
    }
    const requests = params.ids.map((id) => httpClient(`${API_URL}/${resource}/${id}`));
    const responses = await Promise.all(requests);
    return { data: responses.map(({ json }) => json) };
  },

  getManyReference: async (resource, params) => {
    const filter = {
      ...(params.filter ?? {}),
      [params.target]: params.id,
    };

    return provider.getList(resource, {
      ...params,
      filter,
    });
  },

  create: async (resource, params) => {
    const payload = { ...params.data };
    let url = `${API_URL}/${resource}`;

    if (resource === 'transactions') {
      url = `${API_URL}/transactions/admin`;
    }

    const { json } = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return { data: json };
  },

  update: async (resource, params) => {
    if (resource === 'users') {
      const allowedData = { ...(params.data ?? {}) } as Record<string, unknown>;
      delete allowedData.id;
      delete allowedData.hasPassword;
      delete allowedData.createdAt;
      delete allowedData.updatedAt;
      const { json } = await httpClient(`${API_URL}/users/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(allowedData),
      });
      return { data: json };
    }

    if (resource === 'accounts') {
      const {
        account_number,
        account_type,
        status,
        balance,
      } = params.data ?? {};

      const payload: Record<string, unknown> = {};

      if (account_number !== undefined) {
        payload.accountNumber = account_number;
      }
      if (account_type !== undefined) {
        payload.accountType = account_type;
      }
      if (status !== undefined) {
        payload.status = status;
      }
      if (balance !== undefined && balance !== null && balance !== '') {
        const parsedBalance = Number(balance);
        if (!Number.isNaN(parsedBalance)) {
          payload.balance = parsedBalance;
        }
      }

      if (!Object.keys(payload).length) {
        return { data: params.data };
      }

      const { json } = await httpClient(`${API_URL}/accounts/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      return { data: json };
    }

    const url = `${API_URL}/${resource}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'PATCH',
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  updateMany: async (_resource, params) => ({ data: params.ids }),

  delete: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const { json } = await httpClient(url, { method: 'DELETE' });
    return { data: json };
  },

  deleteMany: async (_resource, params) => ({ data: params.ids }),
};

export const dataProvider = provider;
