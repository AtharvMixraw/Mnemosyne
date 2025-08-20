'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  name: string
  about: string
  linkedin: string
  avatar_url: string
}

interface InterviewExperience {
  id: string
  heading: string
  content: string
  position: string
  mode: string
  selected: boolean
  created_at: string
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<InterviewExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // wrapped in useCallback so we can safely add to deps
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // If viewing own profile, redirect to /profile
        if (session.user.id === userId) {
          router.push('/profile')
          return
        }
      }
    } catch (err) {
      console.error("Error getting current user:", err)
    }
  }, [router, userId])

  const getUserProfile = useCallback(async () => {
    try {
      setError(null)
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError("User not found")
        } else {
          setError("Failed to load user profile")
        }
        return
      }

      setProfile(profileData)

      // Fetch user's interview experiences
      const { data: expData, error: expError } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      
      if (expError) {
        console.error("Error fetching experiences:", expError)
      } else if (expData) {
        setExperiences(expData as InterviewExperience[])
      }
    } catch (err) {
      console.error("Error loading user profile:", err)
      setError("Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setError("Invalid user ID")
      setLoading(false)
      return
    }

    getCurrentUser()
    getUserProfile()
  }, [userId, getCurrentUser, getUserProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Profile not found</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-white hover:text-purple-200 transition-colors duration-200">
              MNEMOSYNE
            </h1>
          </Link>
          <h2 className="text-xl text-purple-200 mb-2">
            {profile.name || 'User'}&apos;s Profile
          </h2>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-purple-500/30 overflow-hidden mb-4">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-200 text-2xl font-bold">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {profile.name || 'Anonymous User'}
            </h3>
            <p className="text-gray-400 text-sm">{profile.email}</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {profile.about && (
              <div>
                <h4 className="text-lg font-semibold text-purple-200 mb-3">About</h4>
                <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {profile.about}
                  </p>
                </div>
              </div>
            )}

            {profile.linkedin && (
              <div>
                <h4 className="text-lg font-semibold text-purple-200 mb-3">LinkedIn</h4>
                <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                  <a 
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                  >
                    {profile.linkedin}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interview Experiences Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-200">
              {profile.name || 'User'}&apos;s Interview Experiences
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {experiences.length} experience{experiences.length !== 1 ? 's' : ''} shared
            </p>
          </div>

          {experiences.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No experiences shared yet</h3>
              <p className="text-gray-400">This user hasn&apos;t shared any interview experiences.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map(exp => (
                <Link key={exp.id} href={`/experience/${exp.id}`} className="block">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-500/30 cursor-pointer">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 hover:text-purple-100 transition-colors">
                        {exp.heading || 'Untitled Experience'}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {exp.position && (
                          <span className="px-3 py-1 bg-slate-700/70 text-gray-200 rounded-lg">
                             {exp.position}
                          </span>
                        )}
                        {exp.mode && (
                          <span className="px-3 py-1 bg-slate-700/70 text-gray-200 rounded-lg">
                             {exp.mode}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-lg font-medium ${exp.selected ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'}`}>
                          {exp.selected ? " Selected" : " Not Selected"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-4 line-clamp-3 hover:text-gray-200 transition-colors">
                      {exp.content || 'No content provided'}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                       {new Date(exp.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 transition-colors duration-200 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 6.707a1 1 0 010 1.414L10.586 10l-3.293 3.293a1 1 0 101.414 1.414l4-4a1 1 0 000-1.414l-4-4a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
