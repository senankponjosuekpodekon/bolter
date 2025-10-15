import { DataProvider, fetchUtils } from 'react-admin'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' })
  }
  const token = localStorage.getItem('token')
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`)
  }
  return fetchUtils.fetchJson(url, options)
}

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination
    const query = {
      skip: (page - 1) * perPage,
      take: perPage,
    }
    const url = `${API_URL}/${resource}?${new URLSearchParams(query as any)}`
    const { json } = await httpClient(url)
    return {
      data: json,
      total: json.length,
    }
  },
  getOne: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`
    const { json } = await httpClient(url)
    return { data: json }
  },
  getMany: async (resource, params) => {
    const url = `${API_URL}/${resource}`
    const { json } = await httpClient(url)
    return { data: json }
  },
  getManyReference: async (resource, params) => {
    const url = `${API_URL}/${resource}`
    const { json } = await httpClient(url)
    return { data: json, total: json.length }
  },
  create: async (resource, params) => {
    const url = `${API_URL}/${resource}`
    const { json } = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    })
    return { data: json }
  },
  update: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`
    const { json } = await httpClient(url, {
      method: 'PATCH',
      body: JSON.stringify(params.data),
    })
    return { data: json }
  },
  updateMany: async (resource, params) => {
    return { data: params.ids }
  },
  delete: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`
    const { json } = await httpClient(url, { method: 'DELETE' })
    return { data: json }
  },
  deleteMany: async (resource, params) => {
    return { data: params.ids }
  },
}
