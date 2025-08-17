'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
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
  
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
  
      if (profileError && profileError.code !== "PGRST116") throw profileError
  
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
  
        setProfile({
          id: user.id,
          email: user.email ?? "",
          name: "",
          about: "",
          linkedin: "",
          avatar_url: ""
        })
      } else {
        setProfile(profileData)
      }
      // fetch interview experiences
      const { data: expData, error: expError } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (!expError && expData) {
        setExperiences(expData as InterviewExperience[])
      }
    } catch (err) {
      const e = err as Error
      console.error("Error loading user profile:", e.message)
    } finally {
      setLoading(false)
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

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }))
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

      // Remove from local state
      setExperiences(prev => prev.filter(exp => exp.id !== experienceId))
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
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-white hover:text-purple-200 transition-colors duration-200">
              MNEMOSYNE
            </h1>
          </Link>
          <h2 className="text-xl text-purple-200 mb-2">Your Profile</h2>
          <p className="text-gray-400 text-sm">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-purple-500/30 overflow-hidden mb-4">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-200 text-2xl font-bold">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
            {uploading && <p className="text-purple-200 text-sm">Uploading...</p>}
          </div>

          {/* Profile Form */}
          <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-slate-700/30 border border-slate-600 text-gray-400 px-4 py-3 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium text-purple-200 mb-2">
                About
              </label>
              <textarea
                id="about"
                rows={4}
                placeholder="Tell us about yourself..."
                value={profile.about}
                onChange={(e) => setProfile(prev => ({ ...prev, about: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-purple-200 mb-2">
                LinkedIn Profile
              </label>
              <input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={profile.linkedin}
                onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>

            {message && (
              <div className={`rounded-lg p-3 border ${
                message.includes('successfully') 
                  ? 'bg-green-900/20 border-green-500/50 text-green-200' 
                  : 'bg-red-900/20 border-red-500/50 text-red-200'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
        {/* ---- Interview Experiences Section ---- */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-purple-200">Your Interview Experiences</h2>
              <p className="text-gray-400 text-sm mt-1">Manage your shared experiences</p>
            </div>
            <Link 
              href="/interview" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New
            </Link>
          </div>

          {experiences.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No experiences yet</h3>
              <p className="text-gray-400 mb-6">Share your first interview experience to help others!</p>
              <Link 
                href="/interview" 
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Share Your Experience
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map(exp => (
                <Link key={exp.id} href={`/experience/${exp.id}`} className="block">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-500/30 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
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
                      
                      <button
                        onClick={(e) => deleteExperience(exp.id, e)}
                        disabled={deleting === exp.id}
                        className="ml-4 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                        title="Delete experience"
                      >
                        {deleting === exp.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
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
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}