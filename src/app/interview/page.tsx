"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddInterview() {
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState(false);
  const [mode, setMode] = useState("online");
  const [position, setPosition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("interview_experiences").insert([
      {
        user_id: user.id, //  matches policy (auth.uid())
        heading,
        content,
        selected,
        mode,
        position,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Error saving experience: " + error.message);
    } else {
      alert("Experience saved!");
      router.push("/dashboard");
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-2xl mx-auto p-6">
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

        {/* Main Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Share Your Interview Experience</h1>
            <p className="text-gray-400">Help others by sharing your interview journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Heading Input */}
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">
                 Experience Title
              </label>
              <input
                type="text"
                placeholder="e.g., Software Engineer Interview at Google"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition"
                required
              />
            </div>

            {/* Position Input */}
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">
                 Position Applied For
              </label>
              <input
                type="text"
                placeholder="e.g., Senior Software Engineer, Frontend Developer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition"
              />
            </div>

            {/* Interview Mode */}
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-4">
                 Interview Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="online"
                    checked={mode === "online"}
                    onChange={() => setMode("online")}
                    className="sr-only"
                  />
                  <div className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 transition ${
                    mode === "online" 
                      ? "border-purple-400 bg-purple-500/20 text-purple-200" 
                      : "border-slate-600 bg-slate-700/30 text-gray-300 hover:border-slate-500"
                  }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === "online" ? "border-purple-400" : "border-gray-500"
                    }`}>
                      {mode === "online" && <div className="w-2 h-2 bg-purple-400 rounded-full"></div>}
                    </div>
                    <span className="font-medium"> Online</span>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="offline"
                    checked={mode === "offline"}
                    onChange={() => setMode("offline")}
                    className="sr-only"
                  />
                  <div className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 transition ${
                    mode === "offline" 
                      ? "border-purple-400 bg-purple-500/20 text-purple-200" 
                      : "border-slate-600 bg-slate-700/30 text-gray-300 hover:border-slate-500"
                  }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === "offline" ? "border-purple-400" : "border-gray-500"
                    }`}>
                      {mode === "offline" && <div className="w-2 h-2 bg-purple-400 rounded-full"></div>}
                    </div>
                    <span className="font-medium"> Offline</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">
                 Your Experience
              </label>
              <textarea
                placeholder="Share your interview experience in detail... What were the questions asked? How was the process? Any tips for future candidates?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition resize-none"
                rows={8}
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                Share details about the interview process, questions asked, company culture, etc.
              </p>
            </div>

            {/* Selection Status */}
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-4">
                Interview Outcome
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => setSelected(e.target.checked)}
                  className="sr-only"
                />
                <div className={`flex items-center gap-4 px-6 py-4 rounded-lg border-2 transition ${
                  selected 
                    ? "border-green-400 bg-green-500/20 text-green-200" 
                    : "border-slate-600 bg-slate-700/30 text-gray-300 hover:border-slate-500"
                }`}>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selected ? "border-green-400 bg-green-500" : "border-gray-500"
                  }`}>
                    {selected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">
                      {selected ? "Selected" : "Mark if you were selected"}
                    </span>
                    {selected && <p className="text-sm opacity-75">Congratulations on getting selected!</p>}
                  </div>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving Experience...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Share Your Experience
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Footer Note */}
          <div className="mt-8 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <p className="text-gray-400 text-sm text-center">
              💡 <strong>Tip:</strong> Be detailed and honest in your experience. This helps other candidates prepare better for their interviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}