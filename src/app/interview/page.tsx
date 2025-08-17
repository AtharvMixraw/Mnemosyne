"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bold, Italic, List, ListOrdered, Quote, Eye, EyeOff, Save, AlertCircle } from "lucide-react";

export default function AddInterview() {
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState(false);
  const [mode, setMode] = useState("online");
  const [position, setPosition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Enhanced editor states
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autoSaved, setAutoSaved] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-save functionality
  useEffect(() => {
    if (content.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem('interview-draft', JSON.stringify({
          heading, content, position, mode, selected, timestamp: Date.now()
        }));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [heading, content, position, mode, selected]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('interview-draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      const hoursSinceSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceSave < 24 && confirm('Found a draft from your previous session. Would you like to restore it?')) {
        setHeading(parsed.heading || "");
        setContent(parsed.content || "");
        setPosition(parsed.position || "");
        setMode(parsed.mode || "online");
        setSelected(parsed.selected || false);
      }
    }
  }, []);

  // Update word and character count
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  // Insert formatting at cursor position
  // Insert formatting at cursor position
const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
  
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatText = (type: string) => {
    switch (type) {
      case 'bold':
        insertFormatting('**', '**');
        break;
      case 'italic':
        insertFormatting('*', '*');
        break;
      case 'bullet':
        insertFormatting('\n- ');
        break;
      case 'number':
        insertFormatting('\n1. ');
        break;
      case 'quote':
        insertFormatting('\n> ');
        break;
    }
  };

  // Convert markdown-like text to HTML for preview
  const formatPreviewText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-400 pl-4 italic text-gray-300">$1</blockquote>')
      .replace(/\n/g, '<br>');
  };

  async function handleSubmit(e: { preventDefault: () => void; }) {
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
      localStorage.removeItem('interview-draft'); // Clear draft after successful save
      alert("Experience saved!");
      router.push("/dashboard");
    }
    
    setIsSubmitting(false);
  }

  const writingTips = [
    "Start with the company and role overview",
    "Describe the interview process step by step",
    "Include specific questions you were asked",
    "Mention the interviewer's behavior and atmosphere",
    "Share your preparation strategy",
    "Include any technical challenges or coding problems",
    "Mention salary discussions if any",
    "Add timeline details (how long each round took)",
    "Share your overall experience and tips for others"
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Share Your Interview Experience</h1>
                <p className="text-gray-400">Help others by sharing your interview journey</p>
                {autoSaved && (
                  <div className="mt-2 flex items-center justify-center text-green-400 text-sm">
                    <Save className="w-4 h-4 mr-1" />
                    Draft auto-saved
                  </div>
                )}
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

                {/* Enhanced Content Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-purple-200">
                       Your Experience
                    </label>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-slate-700/50 border border-slate-600 rounded-t-lg border-b-0">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      className="p-2 hover:bg-slate-600/50 rounded text-gray-300 hover:text-white transition"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      className="p-2 hover:bg-slate-600/50 rounded text-gray-300 hover:text-white transition"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('bullet')}
                      className="p-2 hover:bg-slate-600/50 rounded text-gray-300 hover:text-white transition"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('number')}
                      className="p-2 hover:bg-slate-600/50 rounded text-gray-300 hover:text-white transition"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('quote')}
                      className="p-2 hover:bg-slate-600/50 rounded text-gray-300 hover:text-white transition"
                      title="Quote"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-slate-600 mx-2"></div>
                    
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`p-2 hover:bg-slate-600/50 rounded transition ${
                        isPreviewMode ? 'text-purple-400' : 'text-gray-300 hover:text-white'
                      }`}
                      title="Preview"
                    >
                      {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Editor/Preview Area */}
                  <div className="relative">
                    {!isPreviewMode ? (
                      <textarea
                        ref={textareaRef}
                        placeholder="Share your interview experience in detail...

📝 What to include:
• Company and role overview
• Interview process and rounds
• Questions asked (technical & behavioral)
• Atmosphere and interviewer behavior
• Your preparation strategy
• Timeline and duration
• Salary discussions (if any)
• Tips for future candidates

Use **bold** for emphasis, *italic* for highlights, and > for important notes."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-b-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition resize-none font-mono"
                        rows={16}
                        required
                      />
                    ) : (
                      <div 
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-b-lg text-white min-h-[400px] prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: content ? formatPreviewText(content) : '<p class="text-gray-400 italic">Preview will appear here...</p>' 
                        }}
                      />
                    )}
                    
                    {/* Character limit indicator */}
                    {charCount > 2000 && (
                      <div className="absolute bottom-2 right-2 text-xs text-orange-400 bg-slate-800/80 px-2 py-1 rounded">
                        {charCount > 5000 ? '⚠️ Very long' : '💡 Detailed'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>💡 Use the formatting buttons above to make your experience more readable</span>
                    {charCount < 100 && (
                      <span className="text-orange-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Consider adding more details
                      </span>
                    )}
                  </div>
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

          {/* Sidebar with Tips */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 shadow-2xl sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                💡 Writing Tips
              </h3>
              
              <div className="space-y-3">
                {writingTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-300 text-xs">{index + 1}</span>
                    </div>
                    <span className="text-gray-300">{tip}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <h4 className="text-sm font-semibold text-purple-200 mb-2">Formatting Help</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>**bold text** → <strong>bold text</strong></div>
                  <div>*italic text* → <em>italic text</em></div>
                  <div>- bullet point → • bullet point</div>
                  <div>&gt; quote → quote block</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                💾 Your draft is auto-saved as you type
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}