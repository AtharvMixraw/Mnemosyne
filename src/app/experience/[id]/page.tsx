// app/experience/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Link from "next/link";

interface Experience {
  id: string;
  heading: string;     // Matches your DB schema
  content: string;     // Matches your DB schema
  position: string;
  mode: string;
  selected: boolean;   // Matches your DB schema (boolean, not string)
  created_at: string;
  user_id: string;
}

export default function ExperienceDetails() {
  const { id } = useParams();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No experience ID provided");
      setLoading(false);
      return;
    }

    const fetchExperience = async () => {
      try {
        setError(null);
        
        const { data, error } = await supabase
          .from("interview_experiences")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          if (error.code === 'PGRST116') {
            setError("Experience not found");
          } else {
            setError(`Failed to load experience: ${error.message}`);
          }
          return;
        }

        if (!data) {
          setError("Experience not found");
          return;
        }

        console.log("Fetched experience:", data);
        setExperience(data);
        
      } catch (err) {
        console.error("Error fetching experience:", err);
        setError("Failed to load experience");
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Experience not found</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Experience Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              {experience.heading || "Interview Experience"}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm">
              {experience.position && (
                <span className="px-4 py-2 bg-slate-700 text-gray-200 rounded-lg">
                   Position: {experience.position}
                </span>
              )}
              {experience.mode && (
                <span className="px-4 py-2 bg-slate-700 text-gray-200 rounded-lg">
                   Mode: {experience.mode}
                </span>
              )}
              <span
                className={`px-4 py-2 rounded-lg font-semibold ${
                  experience.selected
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {experience.selected ? " Selected" : "Not Selected"}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-6 pb-6 border-b border-slate-700">
            <p className="text-gray-400 text-sm">
               Shared on {new Date(experience.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Experience Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-purple-200 mb-4">Interview Experience</h2>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              {experience.content ? (
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {experience.content}
                </div>
              ) : (
                <p className="text-gray-400 italic">No content provided for this experience.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-700">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
            >
              ← Back to All Experiences
            </Link>
            
            <Link
              href="/interview"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
            >
              Share Your Experience +
            </Link>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <details>
              <summary className="text-gray-400 cursor-pointer">Debug Info</summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                {JSON.stringify(experience, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}