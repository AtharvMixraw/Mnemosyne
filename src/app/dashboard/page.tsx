// app/dashboard/page.tsx

'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import Link from "next/link"

interface Experience {
  id: string
  heading: string      // Matches your DB schema
  content: string      // Matches your DB schema
  position: string
  mode: string
  selected: boolean    // Matches your DB schema (boolean, not string)
  created_at: string
  user_id: string
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        await fetchExperiences()
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Experiences</h1>
          {userEmail && (
            <p className="text-gray-300 mb-4">Logged in as: {userEmail}</p>
          )}
          <div className="flex justify-center gap-4">
            <Link
              href="/interview"
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
            >
              + Add Experience
            </Link>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 text-center text-gray-400 text-sm">
          Found {experiences.length} experiences
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
              <Link
                key={exp.id}
                href={`/experience/${exp.id}`}
                className="block bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/60 transition"
              >
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-purple-200 font-bold">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">Anonymous User</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(exp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Content Preview */}
                <h2 className="text-xl font-bold text-purple-200">
                  {exp.heading || 'Untitled Experience'}
                </h2>
                <p className="text-gray-300 mt-2 line-clamp-3">
                  {exp.content || 'No content provided'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mt-4 text-sm">
                  {exp.position && (
                    <span className="px-3 py-1 bg-slate-700 rounded-lg">
                      Position: {exp.position}
                    </span>
                  )}
                  {exp.mode && (
                    <span className="px-3 py-1 bg-slate-700 rounded-lg">
                      Mode: {exp.mode}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-lg ${
                      exp.selected ? "bg-green-700" : "bg-red-700"
                    }`}
                  >
                    {exp.selected ? "Selected" : "Not Selected"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}