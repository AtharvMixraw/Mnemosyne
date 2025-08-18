// app/experience/[id]/page.tsx - Updated version

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Link from "next/link";

interface Experience {
  id: string;
  heading: string;
  content: string;
  position: string;
  mode: string;
  selected: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string;
    about: string;
    linkedin: string;
  };
}

// Component to render formatted content safely
const FormattedContent = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  
  return (
    <div className="text-gray-200 leading-relaxed space-y-3">
      {lines.map((line, index) => {
        // Skip empty lines but preserve spacing
        if (!line.trim()) {
          return <div key={index} className="h-2"></div>;
        }

        // Bold text with potential italic inside
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={index} className="mb-2">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  const boldContent = part.slice(2, -2);
                  // Check for italic inside bold
                  if (boldContent.includes('*')) {
                    const italicParts = boldContent.split(/(\*.*?\*)/g);
                    return (
                      <strong key={partIndex} className="font-bold text-white">
                        {italicParts.map((italicPart, italicIndex) => {
                          if (italicPart.startsWith('*') && italicPart.endsWith('*')) {
                            return <em key={italicIndex} className="italic">{italicPart.slice(1, -1)}</em>;
                          }
                          return italicPart;
                        })}
                      </strong>
                    );
                  }
                  return <strong key={partIndex} className="font-bold text-white">{boldContent}</strong>;
                }
                
                // Handle italic in non-bold parts
                if (part.includes('*') && !part.includes('**')) {
                  const italicParts = part.split(/(\*.*?\*)/g);
                  return (
                    <span key={partIndex}>
                      {italicParts.map((italicPart, italicIndex) => {
                        if (italicPart.startsWith('*') && italicPart.endsWith('*')) {
                          return <em key={italicIndex} className="italic text-purple-200">{italicPart.slice(1, -1)}</em>;
                        }
                        return italicPart;
                      })}
                    </span>
                  );
                }
                
                return part;
              })}
            </p>
          );
        }
        
        // Italic text (without bold)
        if (line.includes('*') && !line.includes('**')) {
          const parts = line.split(/(\*.*?\*)/g);
          return (
            <p key={index} className="mb-2">
              {parts.map((part, partIndex) => {
                if (part.startsWith('*') && part.endsWith('*')) {
                  return <em key={partIndex} className="italic text-purple-200">{part.slice(1, -1)}</em>;
                }
                return part;
              })}
            </p>
          );
        }
        
        // Bullet points
        if (line.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start mb-2 ml-4">
              <span className="text-purple-400 mr-3 mt-1 flex-shrink-0">•</span>
              <span className="flex-1">{line.slice(2)}</span>
            </div>
          );
        }
        
        // Numbered lists
        if (line.match(/^\d+\. /)) {
          const match = line.match(/^(\d+)\. (.+)$/);
          if (match) {
            return (
              <div key={index} className="flex items-start mb-2 ml-4">
                <span className="text-purple-400 mr-3 mt-0 flex-shrink-0 font-medium">{match[1]}.</span>
                <span className="flex-1">{match[2]}</span>
              </div>
            );
          }
        }
        
        // Quotes
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-purple-400 pl-6 py-2 my-4 bg-slate-800/30 rounded-r-lg">
              <p className="italic text-gray-300 text-lg">{line.slice(2)}</p>
            </blockquote>
          );
        }
        
        // Headers (if you want to support # headers)
        if (line.startsWith('# ')) {
          return (
            <h3 key={index} className="text-xl font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2">
              {line.slice(2)}
            </h3>
          );
        }
        
        if (line.startsWith('## ')) {
          return (
            <h4 key={index} className="text-lg font-semibold text-purple-200 mt-4 mb-2">
              {line.slice(3)}
            </h4>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="mb-2 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default function ExperienceDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    
    if (!id) {
      setError("No experience ID provided");
      setLoading(false);
      return;
    }

    fetchExperience();
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUserId(session.user.id)
      }
    } catch (err) {
      console.error("Error getting current user:", err)
    }
  }

  const fetchExperience = async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from("interview_experiences")
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            avatar_url,
            about,
            linkedin
          )
        `)
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
                {experience.selected ? "Selected" : "Not Selected"}
              </span>
            </div>
          </div>

          {/* Author Info */}
          <div className="mb-6 pb-6 border-b border-slate-700">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:bg-slate-700/30 rounded-lg p-3 -m-3 transition-colors"
              onClick={() => {
                if (experience.user_id === currentUserId) {
                  router.push('/profile')
                } else {
                  router.push(`/profile/${experience.user_id}`)
                }
              }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-purple-200 text-xl font-bold">
                {experience.profiles?.avatar_url ? (
                  <img 
                    src={experience.profiles.avatar_url} 
                    alt={experience.profiles.name || "User"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  experience.profiles?.name 
                    ? experience.profiles.name.charAt(0).toUpperCase()
                    : "U"
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white hover:text-purple-200 transition-colors">
                  {experience.user_id === currentUserId 
                    ? "You" 
                    : (experience.profiles?.name || "Unknown User")
                  }
                </h3>
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
                {experience.profiles?.about && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {experience.profiles.about}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Experience Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-purple-200 mb-4"> Interview Experience</h2>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              {experience.content ? (
                <FormattedContent content={experience.content} />
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
            
            <div className="flex gap-3">
              {experience.user_id !== currentUserId && (
                <button
                  onClick={() => {
                    router.push(`/profile/${experience.user_id}`)
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                >
                  View Profile
                </button>
              )}
              
              <Link
                href="/interview"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              >
                Share Your Experience +
              </Link>
            </div>
          </div>
        </div>

        {/* Debug Info (remove in production)
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <details>
              <summary className="text-gray-400 cursor-pointer">Debug Info</summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                {JSON.stringify(experience, null, 2)}
              </pre>
            </details>
          </div>
        )} */}
      </div>
    </div>
  );
}