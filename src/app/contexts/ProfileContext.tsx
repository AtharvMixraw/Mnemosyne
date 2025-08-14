// contexts/ProfileContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  name: string
  about: string
  linkedin: string
  avatar_url: string
}

interface ProfileContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await getProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function getInitialSession() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (session?.user) {
      await getProfile(session.user.id)
    }
    setLoading(false)
  }

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('profiles')
      .upsert({ ...updates, id: user.id, updated_at: new Date().toISOString() })

    if (error) throw error

    setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  return (
    <ProfileContext.Provider value={{ user, profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}