'use client'
import Link from "next/link";
import Image from "next/image";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-['Manrope',sans-serif] flex flex-col">
      {/* Header */}
      {/* Transparent Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 animate-slide-down">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 transition-transform duration-300 hover:scale-110">
                <Image
                  src="/icon-no-bg.png"
                  alt="Mnemosyne Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-[#13a4ec] transition-all duration-300 hover:scale-105">
                Mnemosyne
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white transition-all duration-200 hover:scale-105">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 text-sm font-semibold text-white bg-[#13a4ec] rounded-md hover:bg-opacity-90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                  Sign Up
                </button>
              </Link>
            </div>
            <button className="md:hidden transition-transform duration-200 hover:scale-110 text-white">
              <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/bg.jpeg"
            alt="Interview collaboration illustration"
            fill
            className="object-cover animate-ken-burns"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/80"></div>
        </div>

        {/* Hero Content */}
        <div className="mt-40 relative z-10 flex items-center justify-center h-full px-6 py-8">
          <div className="text-center text-white max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight drop-shadow-2xl animate-fade-in-up">
              Share Your Interview
              <br />
              <span className="text-[#13a4ec] animate-gradient-text">Experiences</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl font-medium mb-8 leading-relaxed opacity-90 drop-shadow-lg animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Mnemosyne is a collaborative platform where students share their interview experiences, helping peers prepare and succeed together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <Link href="/login">
                <button className="px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  Login
                </button>
              </Link>
              
              <Link href="/signup">
                <button className="group relative px-8 py-4 text-lg font-semibold text-white bg-[#13a4ec] rounded-lg transition-all duration-300 hover:bg-opacity-90 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-[#13a4ec]/25 overflow-hidden">
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="relative z-20 bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-4">
              <Link href="https://x.com/mnemosyne_world" className="text-slate-400 hover:text-[#13a4ec] transition-all duration-200 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                </svg>
              </Link>
              <span className="text-slate-400">© 2024 Mnemosyne</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-100%); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        
        @keyframes gradient-text {
          0%, 100% { color: #13a4ec; }
          50% { color: #3b82f6; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-ken-burns {
          animation: ken-burns 20s ease-out infinite alternate;
        }
        
        .animate-gradient-text {
          animation: gradient-text 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}