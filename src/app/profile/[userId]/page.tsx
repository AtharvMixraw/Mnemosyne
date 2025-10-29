'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'


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
      <div className="min-h-screen bg-[#101c22] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec] mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#101c22] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[#13a4ec] hover:bg-[#0f8ac7] text-white rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#101c22] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Profile not found</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-[#13a4ec] hover:bg-[#0f8ac7] text-white rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101c22] p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 px-4 py-8">
          <Link href="/dashboard" className="inline-block mb-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white hover:text-[#13a4ec] transition-colors duration-200 tracking-tight">
              Mnemosyne
            </h1>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-300 mb-2">
            {profile.name || 'User'}&apos;s Profile
          </h2>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: 'rgba(35, 60, 72, 0.5)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(50, 85, 103, 0.5)'
        }} className="border rounded-xl p-6 sm:p-8 shadow-lg mb-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-[#192b33] border-4 border-[#325567] overflow-hidden mb-4">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.name || 'User'} 
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#13a4ec] text-5xl font-bold">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {profile.name || 'Anonymous User'}
            </h3>
            <p className="text-[#92b7c9] text-sm">{profile.email}</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {profile.about && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">About</h4>
                <div className="bg-[#192b33] border border-[#325567] rounded-lg p-4">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {profile.about}
                  </p>
                </div>
              </div>
            )}

            {profile.linkedin && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">LinkedIn</h4>
                <div className="bg-[#192b33] border border-[#325567] rounded-lg p-4">
                  <a 
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#13a4ec] hover:text-[#0f8ac7] transition-colors break-all"
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
          <div className="mb-6 px-4">
            <h2 className="text-2xl font-bold text-white">
              {profile.name || 'User'}&apos;s Interview Experiences
            </h2>
            <p className="text-[#92b7c9] text-sm mt-1">
              {experiences.length} experience{experiences.length !== 1 ? 's' : ''} shared
            </p>
          </div>

          {experiences.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#325567] bg-[#192b33]/50 py-12 px-6 text-center">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-white mb-2">No experiences shared yet</h3>
              <p className="text-[#92b7c9]">This user hasn&apos;t shared any interview experiences.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map(exp => (
                <Link key={exp.id} href={`/experience/${exp.id}`} className="block">
                  <div className="bg-[#192b33] border border-transparent rounded-lg p-4 transition-all duration-200 hover:border-[#325567] hover:bg-[#233c48]/50 cursor-pointer group">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#13a4ec] transition-colors">
                        {exp.heading || 'Untitled Experience'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {exp.position && (
                          <span className="inline-flex items-center rounded-full bg-[#13a4ec]/20 px-3 py-1 text-xs font-medium text-[#13a4ec]">
                            {exp.position}
                          </span>
                        )}
                        {exp.mode && (
                          <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                            {exp.mode}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          exp.selected 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {exp.selected ? "Received Offer" : "Final Round"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Shared on: {new Date(exp.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center mt-12 py-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#92b7c9] hover:text-[#13a4ec] transition-colors duration-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}