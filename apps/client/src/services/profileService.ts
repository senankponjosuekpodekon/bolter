import api from './api'

export const getProfile = async () => {
    const res = await api.get('/auth/profile')
    return res.data
}

export const updateProfile = async (data: Record<string, unknown>) => {
    const res = await api.patch('/users/profile', data)
    return res.data
}

export const getProfileActivity = async () => {
    const res = await api.get('/auth/profile/activity')
    return res.data
}

export const updatePreferences = async (data: Record<string, unknown>) => {
    // Use the same users profile PATCH endpoint for preferences to keep a single canonical update path
    const res = await api.patch('/users/profile', data)
    return res.data
}
