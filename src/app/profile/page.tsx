'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Cache for storing data across component renders
const cache = {
  profile: null as Profile | null,
  experiences: null as InterviewExperience[] | null,
  lastFetch: {
    profile: 0,
    experiences: 0
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STALE_WHILE_REVALIDATE = 30 * 1000 // 30 seconds

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

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<Profile>({
    id: '',
    email: '',
    name: '',
    about: '',
    linkedin: '',
    avatar_url: ''
  })
  
  const [experiences, setExperiences] = useState<InterviewExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  
  // Memoized cache check function
  const isCacheValid = useCallback((key: 'profile' | 'experiences') => {
    return Date.now() - cache.lastFetch[key] < CACHE_DURATION
  }, [])

  const isCacheStale = useCallback((key: 'profile' | 'experiences') => {
    return Date.now() - cache.lastFetch[key] > STALE_WHILE_REVALIDATE
  }, [])

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      if (!session) {
        console.log("Session not yet available, skipping redirect for now")
        return
      }
  
      const user = session?.user
      if (!user) {
        router.push("/login")
        return
      }

      // Check cache first for immediate UI update
      if (cache.profile && isCacheValid('profile')) {
        setProfile(cache.profile)
        setLoading(false)
      }
      
      if (cache.experiences && isCacheValid('experiences')) {
        setExperiences(cache.experiences)
        setLoading(false)
      }

      // If cache is stale or invalid, fetch fresh data
      const shouldFetchProfile = !cache.profile || isCacheStale('profile')
      const shouldFetchExperiences = !cache.experiences || isCacheStale('experiences')

      if (shouldFetchProfile) {
        await fetchProfileData(user)
      }

      if (shouldFetchExperiences) {
        await fetchExperiencesData(user.id)
      }

    } catch (err) {
      const e = err as Error
      console.error("Error loading user profile:", e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfileData = async (user: { id: string; email?: string }) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError && profileError.code !== "PGRST116") throw profileError

      let profileToSet: Profile

      if (!profileData) {
        // Create a default profile
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{
            id: user.id,
            email: user.email ?? "",
            name: "",
            about: "",
            linkedin: "",
            avatar_url: ""
          }])
        if (insertError) throw insertError

        profileToSet = {
          id: user.id,
          email: user.email ?? "",
          name: "",
          about: "",
          linkedin: "",
          avatar_url: ""
        }
      } else {
        profileToSet = profileData
      }

      // Update cache and state
      cache.profile = profileToSet
      cache.lastFetch.profile = Date.now()
      setProfile(profileToSet)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchExperiencesData = async (userId: string) => {
    try {
      // fetch interview experiences
      const { data: expData, error: expError } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      
      if (!expError && expData) {
        const experiencesData = expData as InterviewExperience[]
        // Update cache and state
        cache.experiences = experiencesData
        cache.lastFetch.experiences = Date.now()
        setExperiences(experiencesData)
      }
    } catch (error) {
      console.error("Error fetching experiences:", error)
    }
  }
  
  async function updateProfile() {
    try {
      setSaving(true)
      setMessage('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const updates = {
        id: user.id,
        name: profile.name,
        about: profile.about,
        linkedin: profile.linkedin,
        email: profile.email,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates)

      if (error) throw error

      // Update cache with new profile data
      cache.profile = { ...profile, ...updates }
      cache.lastFetch.profile = Date.now()

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      setMessage('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const file = event.target.files?.[0]
      if (!file) return

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage('File size should be less than 2MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please upload an image file')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      const updatedProfile = { ...profile, avatar_url: data.publicUrl }
      setProfile(updatedProfile)
      
      // Update cache
      cache.profile = updatedProfile
      cache.lastFetch.profile = Date.now()

      setMessage('Profile picture updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage('Error uploading profile picture')
    } finally {
      setUploading(false)
    }
  }

  async function deleteExperience(experienceId: string, event: React.MouseEvent) {
    // Prevent the click from bubbling up to the Link
    event.preventDefault()
    event.stopPropagation()

    if (!confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(experienceId)
      setMessage('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('interview_experiences')
        .delete()
        .eq('id', experienceId)
        .eq('user_id', user.id) // Extra security: ensure user can only delete their own experiences

      if (error) throw error

      // Remove from local state and cache
      const updatedExperiences = experiences.filter(exp => exp.id !== experienceId)
      setExperiences(updatedExperiences)
      cache.experiences = updatedExperiences
      cache.lastFetch.experiences = Date.now()

      setMessage('Experience deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting experience:', error)
      setMessage('Error deleting experience')
    } finally {
      setDeleting(null)
    }
  }

  async function handleLogout() {
    // Clear cache on logout
    cache.profile = null
    cache.experiences = null
    cache.lastFetch.profile = 0
    cache.lastFetch.experiences = 0
    
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading && !cache.profile && !cache.experiences) {
    return (
      <div className="min-h-screen bg-[#101c22] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101c22] p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 px-4 py-8">
          <Link href="/" className="inline-block mb-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white hover:text-[#13a4ec] transition-colors duration-200 tracking-tight">
              Mnemosyne
            </h1>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-300 mb-2">Profile & Settings</h2>
          <p className="text-[#92b7c9] text-base">Manage your personal information and shared experiences.</p>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: 'rgba(35, 60, 72, 0.5)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(50, 85, 103, 0.5)'
        }} className="border rounded-xl p-6 sm:p-8 shadow-lg mb-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-[#192b33] border-2 border-[#325567] overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-5xl font-bold text-[#13a4ec]">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-[#233c48] hover:bg-[#13a4ec] disabled:bg-[#192b33] text-white p-2 rounded-full border-2 border-[#101c22] transition-all duration-200 hover:scale-110"
                aria-label="Edit profile picture"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadAvatar}
              accept="image/*"
              className="hidden"
            />
            {uploading && <p className="text-[#13a4ec] text-sm mt-2 animate-pulse">Uploading...</p>}
          </div>

          {/* Profile Form */}
          <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-base font-medium text-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  style={{ backgroundColor: 'rgba(25, 43, 51, 0.7)' }}
                  className="w-full border border-[#325567] text-gray-400 px-4 py-3 rounded-lg cursor-not-allowed opacity-60 h-14"
                />
                <p className="text-sm text-[#92b7c9] mt-2">Your email address cannot be changed.</p>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="name" className="block text-base font-medium text-white mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#192b33] border border-[#325567] text-white placeholder-[#92b7c9] px-4 py-3 rounded-lg focus:outline-none focus:border-[#13a4ec] focus:ring-2 focus:ring-[#13a4ec]/50 transition-all duration-200 h-14"
                />
              </div>
            </div>

            <div>
              <label htmlFor="about" className="block text-base font-medium text-white mb-2">
                About
              </label>
              <textarea
                id="about"
                rows={4}
                placeholder="Tell us a little about yourself..."
                value={profile.about}
                onChange={(e) => setProfile(prev => ({ ...prev, about: e.target.value }))}
                className="w-full bg-[#192b33] border border-[#325567] text-white placeholder-[#92b7c9] px-4 py-3 rounded-lg focus:outline-none focus:border-[#13a4ec] focus:ring-2 focus:ring-[#13a4ec]/50 transition-all duration-200 resize-y"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-base font-medium text-white mb-2">
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={profile.linkedin}
                onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full bg-[#192b33] border border-[#325567] text-white placeholder-[#92b7c9] px-4 py-3 rounded-lg focus:outline-none focus:border-[#13a4ec] focus:ring-2 focus:ring-[#13a4ec]/50 transition-all duration-200 h-14"
              />
            </div>

            {message && (
              <div className={`rounded-lg p-3 text-center text-sm ${
                message.includes('successfully') 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                <p>{message}</p>
              </div>
            )}

            <div className="flex flex-col-reverse items-center gap-4 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto sm:px-8 bg-transparent border border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-gray-700/50 hover:text-white"
              >
                Logout
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 bg-[#13a4ec] hover:scale-[1.02] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 hover:shadow-lg disabled:transform-none"
                style={{ boxShadow: '0 4px 14px 0 rgba(19, 164, 236, 0.3)' }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Interview Experiences Section */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">My Interview Experiences</h2>
              <p className="text-[#92b7c9] mt-1">A list of all the interviews you have shared.</p>
            </div>
            <Link 
              href="/interview" 
              className="bg-[#233c48] hover:bg-[#325567] text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-bold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New
            </Link>
          </div>

          {experiences.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#325567] bg-[#192b33]/50 py-12 px-6 text-center">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-white mb-2">No items yet</h3>
              <p className="text-base text-[#92b7c9] mb-6">You haven&apos;t shared any interview experiences.<br/>Help the community by adding your first one!</p>
              <Link 
                href="/interview" 
                className="inline-flex items-center gap-2 bg-[#13a4ec] hover:scale-105 text-white px-4 py-2 rounded-lg transition-transform duration-200 text-sm font-bold"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Share Your First Experience
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map(exp => (
                <Link key={exp.id} href={`/experience/${exp.id}`} className="block">
                  <div className="bg-[#192b33] border border-transparent rounded-lg p-4 transition-all duration-200 hover:border-[#325567] hover:bg-[#233c48]/50 cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                          {exp.heading || 'Untitled Experience'}
                        </h3>
                      </div>
                      
                      <button
                        onClick={(e) => deleteExperience(exp.id, e)}
                        disabled={deleting === exp.id}
                        className="ml-4 p-2 rounded-full text-gray-400 transition-colors duration-200 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete experience"
                      >
                        {deleting === exp.id ? (
                          <div className="animate-spin w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
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