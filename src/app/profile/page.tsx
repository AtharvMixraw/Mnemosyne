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
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    } catch (err) {
      const e = err as Error
      console.error("Error loading user profile:", e.message)
    } finally {
      setLoading(false) // <-- fixes unused setLoading warning
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

        {/* Navigation */}
        <div className="text-center mt-6">
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}