import { useAuthStore } from '../stores/authStore'
import { getProfile, updateProfile, getProfileActivity, updatePreferences } from '../services/profileService'
import { useEffect } from 'react'

export function useProfile() {
    const { user, setUser, preferences, setPreferences } = useAuthStore()

    useEffect(() => {
        getProfile().then(setUser)
        getProfileActivity().then(() => { })
        updatePreferences(preferences || {}).then(setPreferences)
    }, [])

    return {
        user,
        preferences,
        updateProfile,
        updatePreferences,
        getProfileActivity,
    }
}
