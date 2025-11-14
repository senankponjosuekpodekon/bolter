import api from './api'

export const getProfile = async () => {
  const res = await api.get('/auth/profile')
  return res.data
}

export const updateProfile = async (data: Record<string, any>) => {
  const res = await api.post('/auth/profile/update', data)
  return res.data
}

export const getProfileActivity = async () => {
  const res = await api.get('/auth/profile/activity')
  return res.data
}

export const updatePreferences = async (data: Record<string, any>) => {
  const res = await api.post('/auth/profile/preferences', data)
  return res.data
}
