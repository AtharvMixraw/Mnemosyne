"use client"

import { useState } from "react"
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setMessage(error.message)
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.push("/profile");
      }
    }
    
    setIsLoading(false)
  }

  return (
    <>
      <div className="relative bg-slate-50 text-slate-900 min-h-screen font-['Manrope',sans-serif]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/auth-bg.jpeg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-slate-900/40"></div>
        </div>
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
          {/* Header
          <header className="sticky top-0 z-10 w-full bg-slate-50/80 backdrop-blur-md animate-slide-down">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 transition-transform duration-300 hover:scale-110">
                    <img 
                      src="/icon-no-bg.png" 
                      alt="Mnemosyne Logo" 
                      className="h-full w-full object-contain animate-pulse"
                    />
                  </div>
                  <Link href="/" className="text-xl font-bold tracking-tight hover:text-[#13a4ec] transition-all duration-300 hover:scale-105">
                    Mnemosyne
                  </Link>
                </div>
                <div className="hidden items-center gap-8 md:flex">
                  <Link href="/signup" className="flex h-9 items-center justify-center rounded-md bg-slate-200 px-4 text-sm font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-300 hover:scale-105">
                    Sign up
                  </Link>
                </div>
                <button className="md:hidden transition-transform duration-200 hover:scale-110">
                  <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </header> */}

          {/* Main Content */}
          <main className="flex flex-1 items-center justify-center py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              <div className="animate-fade-in-down">
                <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  Sign in to your account to continue
                </p>
              </div>

              <div className="mt-8 space-y-6 rounded-lg bg-white/90 backdrop-blur-sm p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in" style={{animationDelay: '0.4s'}}>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="animate-slide-in-left" style={{animationDelay: '0.6s'}}>
                    <label className="sr-only" htmlFor="email">Email</label>
                    <input
                      autoComplete="email"
                      className="relative block w-full appearance-none rounded-md border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-[#13a4ec] focus:outline-none focus:ring-[#13a4ec] focus:scale-105 sm:text-sm transition-all duration-200 hover:border-slate-400"
                      id="email"
                      name="email"
                      placeholder="Email address"
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="animate-slide-in-right" style={{animationDelay: '0.8s'}}>
                    <label className="sr-only" htmlFor="password">Password</label>
                    <input
                      autoComplete="current-password"
                      className="relative block w-full appearance-none rounded-md border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-[#13a4ec] focus:outline-none focus:ring-[#13a4ec] focus:scale-105 sm:text-sm transition-all duration-200 hover:border-slate-400"
                      id="password"
                      name="password"
                      placeholder="Password"
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  {message && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 animate-shake">
                      <p className="text-red-600 text-sm">{message}</p>
                    </div>
                  )}

                  <div className="animate-bounce-in" style={{animationDelay: '1.0s'}}>
                    <button
                      className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#13a4ec] py-3 px-4 text-sm font-semibold text-white hover:bg-opacity-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                      type="submit"
                      disabled={isLoading}
                    >
                      <span className="relative z-10">
                        {isLoading ? "Signing in..." : "Sign in"}
                      </span>
                      {/* Button shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                </form>

                <div className="text-center animate-fade-in" style={{animationDelay: '1.2s'}}>
                  <Link 
                    className="text-sm font-medium text-slate-600 hover:text-[#13a4ec] transition-colors duration-200 hover:underline" 
                    href="/signup"
                  >
                    Don&apos;t have an account? Sign up
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3) translateY(50px); }
          50% { opacity: 1; transform: scale(1.05) translateY(-10px); }
          70% { transform: scale(0.9) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  )
}