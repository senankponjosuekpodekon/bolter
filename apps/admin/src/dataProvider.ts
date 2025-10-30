import { DataProvider, fetchUtils } from 'react-admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const httpClient = (url: string, options: any = {}) => {
  const request: any = { ...options };
  request.headers = new Headers(request.headers || { Accept: 'application/json' });

  const token = localStorage.getItem('token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (request.method || 'GET').toUpperCase();
  if (method !== 'GET' && request.body && !(request.body instanceof FormData)) {
    request.headers.set('Content-Type', 'application/json');
  }

  return fetchUtils.fetchJson(url, request);
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

const appendFilters = (searchParams: URLSearchParams, filters: Record<string, any> = {}) => {
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

const parseListResponse = (json: any, headers?: Headers) => {
  let data: any[] = [];
  if (Array.isArray(json)) {
    data = json;
  } else if (json?.data && Array.isArray(json.data)) {
    data = json.data;
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

  if ((total === undefined || Number.isNaN(total)) && typeof json?.total === 'number') {
    total = json.total;
  }

  if (total === undefined || Number.isNaN(total)) {
    total = data.length;
  }

  return { data, total };
};

const provider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
    const searchParams = new URLSearchParams();

    searchParams.set('skip', String((page - 1) * perPage));
    searchParams.set('take', String(perPage));

    appendFilters(searchParams, params.filter ?? {});

    if (isAdminUser() && (resource === 'accounts' || resource === 'transactions')) {
      searchParams.set('scope', 'admin');
    }

    const queryString = searchParams.toString();
    const url = `${API_URL}/${resource}${queryString ? `?${queryString}` : ''}`;
    const { json, headers } = await httpClient(url);
    return parseListResponse(json, headers);
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
      const { id, hasPassword, createdAt, updatedAt, ...allowedData } = params.data ?? {};
      const { json } = await httpClient(`${API_URL}/users/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(allowedData),
      });
      return { data: json };
    }

    if (resource === 'accounts') {
      const {
        id: _id,
        user: _user,
        user_id: _userId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        ...rest
      } = params.data ?? {};

      const payload: Record<string, any> = {};

      if (rest.account_number !== undefined) {
        payload.accountNumber = rest.account_number;
      }
      if (rest.account_type !== undefined) {
        payload.accountType = rest.account_type;
      }
      if (rest.status !== undefined) {
        payload.status = rest.status;
      }
      if (rest.balance !== undefined && rest.balance !== null && rest.balance !== '') {
        const parsedBalance = Number(rest.balance);
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
