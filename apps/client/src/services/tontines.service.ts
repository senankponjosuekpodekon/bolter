import api from './api'

export interface CreateTontineDto {
  name: string
  description?: string
  contribution_amount: number
  currency?: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  total_cycles: number
  cycle_duration_days: number
  distribution_method?: 'MANUAL_ORDER' | 'RANDOM' | 'SENIORITY' | 'LOTTERY'
  late_payment_penalty_percent?: number
  withdrawal_allowed?: boolean
  withdrawal_penalty_percent?: number
  metadata?: Record<string, unknown>
  initial_members?: Array<{
    user_id: string
    distribution_order?: number
    phone_number?: string
    email_notification?: boolean
    sms_notification?: boolean
  }>
}

export interface AddMemberDto {
  user_id: string
  distribution_order?: number
  phone_number?: string
  email_notification?: boolean
  sms_notification?: boolean
}

export interface RecordContributionDto {
  member_id: string
  cycle_id: string
  amount: number
  payment_method?: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'WALLET'
  payment_reference?: string
}

export const tontinesService = {
  list: async () => {
    const { data } = await api.get('/tontines')
    return data
  },
  get: async (id: string) => {
    const { data } = await api.get(`/tontines/${id}`)
    return data
  },
  create: async (dto: CreateTontineDto) => {
    const { data } = await api.post('/tontines', dto)
    return data
  },
  update: async (id: string, dto: Partial<CreateTontineDto>) => {
    const { data } = await api.put(`/tontines/${id}`, dto)
    return data
  },
  start: async (id: string) => {
    const { data } = await api.post(`/tontines/${id}/start`)
    return data
  },
  addMember: async (id: string, dto: AddMemberDto) => {
    const { data } = await api.post(`/tontines/${id}/members`, dto)
    return data
  },
  members: async (id: string) => {
    const { data } = await api.get(`/tontines/${id}/members`)
    return data
  },
  recordContribution: async (id: string, dto: RecordContributionDto) => {
    const { data } = await api.post(`/tontines/${id}/contributions`, dto)
    return data
  },
  statistics: async (id: string) => {
    const { data } = await api.get(`/tontines/${id}/statistics`)
    return data
  },
  memberStatistics: async (id: string, memberId: string) => {
    const { data } = await api.get(`/tontines/${id}/members/${memberId}/statistics`)
    return data
  },
  createInvitation: async (id: string, dto: { expires_in_days?: number; max_uses?: number }) => {
    const { data } = await api.post(`/tontines/${id}/invitations`, dto)
    return data
  },
  getTontineByInviteCode: async (code: string) => {
    const { data } = await api.get(`/tontines/invite/${code}`)
    return data
  },
  applyToTontine: async (code: string, message?: string) => {
    const { data } = await api.post(`/tontines/invite/${code}/apply`, { message })
    return data
  },
  getApplications: async (id: string) => {
    const { data } = await api.get(`/tontines/${id}/applications`)
    return data
  },
  reviewApplication: async (id: string, applicationId: string, action: 'approve' | 'reject') => {
    const { data } = await api.post(`/tontines/${id}/applications/${applicationId}/review`, { action })
    return data
  },
}
