// app/dashboard/page.tsx

'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import Link from "next/link"

interface Experience {
  id: string
  heading: string
  content: string
  position: string
  mode: string
  selected: boolean
  created_at: string
  user_id: string
}

interface Profile {
  id: string
  name: string
  avatar_url: string
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          router.push("/login")
          return
        }

        const session = sessionData?.session

        if (!session) {
          router.push("/login")
          return
        }

        setUserEmail(session.user.email ?? null)
        setUserId(session.user.id)
        await Promise.all([fetchExperiences(), fetchProfile(session.user.id)])
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("Profile fetch error:", error)
        return
      }

      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    }
  }

  // Fetch ALL experiences from all users (public feed)
  async function fetchExperiences() {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from("interview_experiences")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase query error:", error)
        setError(`Failed to fetch experiences: ${error.message}`)
        return
      }

      console.log("Raw data from Supabase:", data)
      
      if (!data) {
        console.log("No data returned from query")
        setExperiences([])
        return
      }

      setExperiences(data as Experience[])
      
    } catch (err) {
      console.error("Error fetching experiences:", err)
      setError("Failed to load experiences")
    } finally {
      setLoading(false)
    }
  }

  // Enhanced delete function with detailed debugging
async function deleteExperience(experienceId: string, experienceUserId: string) {
  console.log('🗑️ Delete attempt started:', { experienceId, experienceUserId, currentUserId: userId })
  
  // Check if the experience belongs to the current user
  if (experienceUserId !== userId) {
    console.log('❌ Permission denied: Experience belongs to different user')
    setMessage('You can only delete your own experiences')
    setTimeout(() => setMessage(''), 3000)
    return
  }

  if (!confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
    console.log('❌ User cancelled deletion')
    return
  }

  try {
    setDeleting(experienceId)
    setMessage('')
    console.log('🔄 Starting deletion process...')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ Error getting user:', userError)
      throw userError
    }
    if (!user) {
      console.error('❌ No user found')
      throw new Error('No user logged in')
    }
    console.log('✅ User authenticated:', user.id)

    // First, verify the record exists and belongs to the user
    console.log('🔍 Verifying record exists...')
    const { data: existingRecord, error: verifyError } = await supabase
      .from('interview_experiences')
      .select('id, user_id, heading')
      .eq('id', experienceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (verifyError) {
      console.error('❌ Error verifying record:', verifyError)
      throw new Error(`Verification failed: ${verifyError.message}`)
    }

    if (!existingRecord) {
      console.error('❌ Record not found or permission denied')
      throw new Error('Experience not found or you do not have permission to delete it')
    }

    console.log('✅ Record verified:', existingRecord)

    // Perform the delete operation
    console.log('🗑️ Executing delete operation...')
    const { data: deleteData, error: deleteError } = await supabase
      .from('interview_experiences')
      .delete()
      .eq('id', experienceId)
      .eq('user_id', user.id)
      .select() // This will return the deleted rows

    if (deleteError) {
      console.error('❌ Supabase delete error:', deleteError)
      throw new Error(`Delete failed: ${deleteError.message}`)
    }

    console.log('✅ Delete operation result:', deleteData)

    // Verify the record is actually deleted
    console.log('🔍 Verifying deletion...')
    const { data: verifyDeletion, error: verifyDelError } = await supabase
      .from('interview_experiences')
      .select('id')
      .eq('id', experienceId)
      .maybeSingle()

    if (verifyDelError && verifyDelError.code !== 'PGRST116') {
      console.error('❌ Error verifying deletion:', verifyDelError)
    } else if (verifyDeletion) {
      console.warn('⚠️ Record still exists after deletion!', verifyDeletion)
      throw new Error('Record still exists after deletion attempt')
    } else {
      console.log('✅ Deletion verified - record no longer exists')
    }

    // Update local state
    console.log('🔄 Updating local state...')
    setExperiences(prev => {
      const newExperiences = prev.filter(exp => exp.id !== experienceId)
      console.log(`📊 Updated experiences count: ${prev.length} → ${newExperiences.length}`)
      return newExperiences
    })

    setMessage('Experience deleted successfully!')
    console.log('✅ Deletion completed successfully')
    
    // Clear success message after 3 seconds
    setTimeout(() => setMessage(''), 3000)

  } catch (error) {
    console.error('💥 Error in deleteExperience:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error deleting experience'
    setMessage(`Error: ${errorMessage}`)
    
    // Clear error message after 5 seconds
    setTimeout(() => setMessage(''), 5000)
  } finally {
    setDeleting(null)
    console.log('🏁 Delete operation finished')
  }
}

// Add a function to manually check if a record exists (for debugging)
async function debugCheckRecord(experienceId: string) {
  console.log('🔍 Debug: Checking if record exists...')
  try {
    const { data, error } = await supabase
      .from('interview_experiences')
      .select('*')
      .eq('id', experienceId)
      .maybeSingle()

    if (error) {
      console.error('Debug error:', error)
    } else {
      console.log('Debug result:', data ? 'Record EXISTS' : 'Record NOT FOUND', data)
    }
  } catch (err) {
    console.error('Debug exception:', err)
  }
}

// Also add a refresh function to force reload from database
async function forceRefreshExperiences() {
  console.log('🔄 Force refreshing experiences from database...')
  setLoading(true)
  
  try {
    const { data, error } = await supabase
      .from("interview_experiences")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Force refresh error:", error)
      setError(`Failed to refresh: ${error.message}`)
      return
    }

    console.log('🔄 Fresh data from database:', data?.length || 0, 'records')
    setExperiences(data as Experience[] || [])
    setError(null)
    
  } catch (err) {
    console.error("Force refresh exception:", err)
    setError("Failed to refresh experiences")
  } finally {
    setLoading(false)
  }
}

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">User: {userEmail}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="relative mb-10">
          {/* Profile Picture - Top Right */}
          <div className="absolute top-0 right-0">
            <Link href="/profile" className="block">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border-2 border-purple-400/30 hover:border-purple-400 transition-colors cursor-pointer group">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-200 font-bold bg-gradient-to-br from-purple-500 to-blue-500">
                    {profile?.name 
                      ? profile.name.charAt(0).toUpperCase() 
                      : userEmail 
                        ? userEmail.charAt(0).toUpperCase() 
                        : "U"}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Title and Actions - Centered */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Interview Experiences</h1>
            <div className="flex justify-center gap-4">
              <Link
                href="/interview"
                className="px-5 py-2 bg-black hover:bg-gray-700 text-white rounded-lg shadow"
              >
                Add Experience
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-black hover:bg-gray-700 text-white rounded-lg shadow"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-lg p-3 border mb-6 ${
            message.includes('successfully') 
              ? 'bg-green-900/20 border-green-500/50 text-green-200' 
              : 'bg-red-900/20 border-red-500/50 text-red-200'
          }`}>
            <p className="text-sm text-center">{message}</p>
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-4 text-center text-gray-400 text-sm">
          Found {experiences.length} experiences from all users
        </div>

        {/* Experiences Feed */}
        {experiences.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">No experiences shared yet.</p>
            <p className="text-gray-500 text-sm">Be the first to share your interview experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/60 transition relative"
              >
                {/* Delete Button - Only show for user's own experiences */}
                {exp.user_id === userId && (
                  <button
                    onClick={() => deleteExperience(exp.id, exp.user_id)}
                    disabled={deleting === exp.id}
                    className="absolute top-4 right-4 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Delete your experience"
                  >
                    {deleting === exp.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-purple-200 font-bold">
                    {exp.user_id === userId ? (
                      // Show user's own profile picture/initial
                      profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        profile?.name ? profile.name.charAt(0).toUpperCase() : 
                        userEmail ? userEmail.charAt(0).toUpperCase() : "U"
                      )
                    ) : (
                      // Show anonymous for other users
                      "A"
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {exp.user_id === userId ? "You" : "Anonymous User"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(exp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Content Preview - Clickable for details */}
                <Link href={`/experience/${exp.id}`} className="block">
                  <h2 className="text-xl font-bold text-purple-200 hover:text-purple-100 transition-colors">
                    {exp.heading || 'Untitled Experience'}
                  </h2>
                  {/* <p className="text-gray-300 mt-2 line-clamp-3 hover:text-gray-200 transition-colors">
                    {exp.content || 'No content provided'}
                  </p> */}
                </Link>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mt-4 text-sm">
                  {exp.position && (
                    <span className="px-3 py-1 bg-slate-700 text-gray-200 rounded-lg">
                       {exp.position}
                    </span>
                  )}
                  {exp.mode && (
                    <span className="px-3 py-1 bg-slate-700 text-gray-200 rounded-lg">
                       {exp.mode}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-lg font-medium ${
                      exp.selected ? "bg-green-600/80 text-white" : "bg-red-600/80 text-white"
                    }`}
                  >
                    {exp.selected ? " Selected" : " Not Selected"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}