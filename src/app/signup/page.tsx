'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (password !== confirm) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      setMessage(error.message)
    } else {
      router.push("/profile")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating orbs with different positions for signup */}
        <div className="absolute top-1/3 left-1/5 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-2/3 right-1/5 w-36 h-36 bg-purple-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 left-2/5 w-32 h-32 bg-pink-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/5 right-1/3 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px'}}>
        </div>
        
        {/* Subtle scan lines */}
        <div className="absolute inset-0 opacity-[0.02]" 
             style={{background: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.1) 50%)', backgroundSize: '2px 100%'}}>
        </div>
        
        {/* Flowing particles */}
        <div className="absolute top-0 left-0 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-float-1"></div>
        <div className="absolute top-1/4 right-0 w-1 h-1 bg-pink-400 rounded-full opacity-60 animate-float-2"></div>
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-float-3"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with enhanced animations */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-block mb-6 group">
            <h1 className="text-4xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300 transform group-hover:scale-105">
              MNEMOSYNE
            </h1>
          </Link>
          <h2 className="text-xl text-purple-200 mb-2 animate-slide-up" style={{animationDelay: '0.1s'}}>Create Account</h2>
          <p className="text-gray-400 text-sm animate-slide-up" style={{animationDelay: '0.2s'}}>Join us to access interviews from everywhere</p>
        </div>

        {/* Enhanced Signup Form with glassmorphism */}
        <div className="relative group animate-slide-up" style={{animationDelay: '0.3s'}}>
          {/* Multi-color glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          
          <div className="relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 hover:bg-slate-700/70 focus:shadow-lg focus:shadow-cyan-500/10"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-slate-700/70 focus:shadow-lg focus:shadow-purple-500/10"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm" className="block text-sm font-medium text-purple-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    id="confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all duration-300 hover:bg-slate-700/70 focus:shadow-lg focus:shadow-pink-500/10"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {message && (
                <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 animate-shake">
                  <p className="text-red-200 text-sm">{message}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="relative w-full overflow-hidden bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 disabled:from-purple-800 disabled:to-purple-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none shadow-lg hover:shadow-xl hover:shadow-purple-500/25 group"
              >
                <span className="relative z-10">
                  {isLoading ? "Creating account..." : "Create Account"}
                </span>
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-4 opacity-80">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home with enhanced hover effect */}
        <div className="text-center mt-6 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <Link href="/" className="text-gray-400 hover:text-cyan-300 text-sm transition-all duration-200 hover:transform hover:translate-x-[-4px] inline-flex items-center gap-1">
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          33% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          66% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { transform: translateY(-30px) translateX(-15px); opacity: 0.8; }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          25% { transform: translateY(-15px) translateX(8px); opacity: 0.3; }
          75% { transform: translateY(-25px) translateX(-12px); opacity: 0.9; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        
        .animate-float-2 {
          animation: float-2 8s ease-in-out infinite;
        }
        
        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}