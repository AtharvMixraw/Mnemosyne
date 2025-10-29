/* eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import Link from "next/link"
import { useData } from "../contexts/DataContext"
import Image from 'next/image'

// interface Experience {
//   id: string
//   heading: string
//   content: string
//   position: string
//   mode: string
//   selected: boolean
//   created_at: string
//   user_id: string
//   profiles?: {
//     id: string
//     name: string
//     avatar_url: string
//     about: string
//     linkedin: string
//   }
// }

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState("")
  const router = useRouter()

  // Use the data context
  const {
    profile,
    experiences,
    fetchProfile,
    fetchExperiences,
    removeExperienceFromCache,
    experiencesLoading,
    profileLoading
  } = useData()

  // Initialize auth and fetch data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
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

        // Fetch data using context methods (will use cache automatically)
        await Promise.all([
          fetchProfile(session.user.id),
          fetchExperiences()
        ])
      } catch (error) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, fetchProfile, fetchExperiences])

  // Memoized filtered experiences for search
  const filteredExperiences = useMemo(() => {
    if (!search.trim()) return experiences

    const lower = search.toLowerCase()
    return experiences.filter(exp =>
      exp.heading?.toLowerCase().includes(lower) ||
      exp.content?.toLowerCase().includes(lower) ||
      exp.position?.toLowerCase().includes(lower) ||
      exp.mode?.toLowerCase().includes(lower) ||
      exp.profiles?.name?.toLowerCase().includes(lower)
    )
  }, [experiences, search])

  // Debounced search handler
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
  }, [])

  // Delete experience with optimistic updates
  const deleteExperience = useCallback(async (experienceId: string, experienceUserId: string) => {
    if (experienceUserId !== userId) {
      setMessage('You can only delete your own experiences')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (!confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(experienceId)
      setMessage('')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user logged in')

      // Optimistically remove from UI
      removeExperienceFromCache(experienceId)

      const { error: deleteError } = await supabase
        .from('interview_experiences')
        .delete()
        .eq('id', experienceId)
        .eq('user_id', user.id)

      if (deleteError) {
        // Revert optimistic update on error by refetching
        await fetchExperiences(true)
        throw new Error(`Delete failed: ${deleteError.message}`)
      }

      setMessage('Experience deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting experience'
      setMessage(`Error: ${errorMessage}`)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setDeleting(null)
    }
  }, [userId, removeExperienceFromCache, fetchExperiences])

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }, [router])

  // Show loading only if we have no cached data
  const showLoading = (experiencesLoading || profileLoading) && experiences.length === 0 && !profile

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2 break-all">User: {userEmail}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header - Mobile Optimized */}
        <div className="mb-8 sm:mb-10">
          {/* Mobile Layout - Stack vertically */}
          <div className="sm:hidden">
            {/* Profile Picture - Top Center on Mobile */}
            <div className="flex justify-center mb-4">
              <Link href="/profile" className="block">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 border-2 border-purple-400/30 hover:border-purple-400 transition-colors cursor-pointer group">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url} 
                      alt="Profile" 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-200 font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
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

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Interview Experiences</h1>
              
              {/* Action Buttons - Stack on mobile */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/interview"
                  className="px-5 py-3 bg-black hover:bg-gray-700 text-white rounded-lg shadow text-center transition-colors"
                >
                  Add Experience
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Original positioning */}
          <div className="hidden sm:block relative">
            {/* Profile Picture - Top Right on Desktop */}
            <div className="absolute top-0 right-0">
              <Link href="/profile" className="block">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border-2 border-purple-400/30 hover:border-purple-400 transition-colors cursor-pointer group">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url} 
                      alt="Profile" 
                      width={64}
                      height={64}
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

            {/* Title + Actions */}
            <div className="text-center pr-16">
              <h1 className="text-3xl font-bold text-white mb-6">Interview Experiences</h1>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/interview"
                  className="px-5 py-2 bg-black hover:bg-gray-700 text-white rounded-lg shadow"
                >
                  Add Experience
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile Optimized */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by role, heading, content, or author..."
            className="w-full px-4 py-3 sm:py-2 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
          />
        </div>

        {/* Loading indicator for background updates */}
        {experiencesLoading && experiences.length > 0 && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              Refreshing experiences...
            </div>
          </div>
        )}

        {/* Message Display - Mobile Optimized */}
        {message && (
          <div className={`rounded-lg p-3 border mb-6 ${
            message.includes('successfully') 
              ? 'bg-green-900/20 border-green-500/50 text-green-200' 
              : 'bg-red-900/20 border-red-500/50 text-red-200'
          }`}>
            <p className="text-sm text-center break-words">{message}</p>
          </div>
        )}

        {/* Debug Info - Mobile Optimized */}
        <div className="mb-4 text-center text-gray-400 text-xs sm:text-sm px-2">
          Found {filteredExperiences.length} experiences {search ? `for "${search}"` : "from all users"}
        </div>

        {/* Experiences Feed - Mobile Optimized */}
        {filteredExperiences.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              {search ? `No experiences found for "${search}"` : "No experiences found."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredExperiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sm:p-6 shadow-lg hover:bg-slate-700/60 transition relative"
              >
                {/* Delete Button - Mobile Optimized */}
                {exp.user_id === userId && (
                  <button
                    onClick={() => deleteExperience(exp.id, exp.user_id)}
                    disabled={deleting === exp.id}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
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

                {/* Author Info - Mobile Optimized */}
                <div 
                  className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 -m-2 transition-colors pr-12 sm:pr-2"
                  onClick={() => {
                    if (exp.user_id === userId) {
                      router.push('/profile')
                    } else {
                      router.push(`/profile/${exp.user_id}`)
                    }
                  }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-purple-200 font-bold flex-shrink-0">
                    {exp.user_id === userId ? (
                      profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="You" width={64}
                        height={64} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm sm:text-base">
                          {profile?.name ? profile.name.charAt(0).toUpperCase() : 
                          userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                        </span>
                      )
                    ) : (
                      exp.profiles?.avatar_url ? (
                        <Image src={exp.profiles.avatar_url} alt={exp.profiles.name || "User"} width={64}
                        height={64} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm sm:text-base">
                          {exp.profiles?.name ? exp.profiles.name.charAt(0).toUpperCase() : "U"}
                        </span>
                      )
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold hover:text-purple-200 transition-colors text-sm sm:text-base truncate">
                      {exp.user_id === userId ? "You" : (exp.profiles?.name || "Unknown User")}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {new Date(exp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Content Preview - Mobile Optimized */}
                <Link href={`/experience/${exp.id}`} className="block mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-purple-200 hover:text-purple-100 transition-colors line-clamp-2 break-words">
                    {exp.heading || 'Untitled Experience'}
                  </h2>
                </Link>

                {/* Tags - Mobile Optimized */}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                  {exp.position && (
                    <span className="px-2 py-1 sm:px-3 bg-slate-700 text-gray-200 rounded-lg break-all max-w-full">
                       {exp.position}
                    </span>
                  )}
                  {exp.mode && (
                    <span className="px-2 py-1 sm:px-3 bg-slate-700 text-gray-200 rounded-lg">
                       {exp.mode}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 sm:px-3 rounded-lg font-medium flex-shrink-0 ${
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