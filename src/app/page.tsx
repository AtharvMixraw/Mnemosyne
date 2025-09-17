import Link from "next/link";
import Image from "next/image";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 relative">
            <Image
              src="/icon-no-bg.png"
              alt="Mnemosyne Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Mnemosyne</h2>
        </div>

        <nav className="flex items-center gap-2">
          {/* Auth Buttons */}
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-bold text-gray-900 rounded-md hover:bg-gray-100 transition-colors">
              Login
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-md hover:opacity-90 transition-opacity">
              Sign Up
            </button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex justify-center px-4 py-16 sm:px-10 md:px-20 lg:px-40">
        <div className="w-full max-w-7xl">
          {/* Hero Section */}
          <div className="relative min-h-[700px] rounded-lg overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/bg.jpeg"
                alt="Interview collaboration illustration"
                fill
                className="object-cover"
                priority
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/60"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 py-20 text-center text-white">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 max-w-5xl leading-tight drop-shadow-2xl">
                Share Your Interview Experiences
              </h1>
              
              <p className="max-w-4xl text-xl md:text-2xl lg:text-3xl font-medium mb-12 leading-relaxed opacity-95 drop-shadow-lg">
                Mnemosyne is a collaborative platform where students share their interview experiences, helping peers prepare and succeed together.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="#" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">
                Contact Us
              </Link>
            </div>

            {/* Social Icons */}
            <div className="flex justify-center gap-4">
              <Link href="https://x.com/mnemosyne_world" className="text-gray-600 hover:text-blue-500 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <p className="mt-6 text-center text-sm text-gray-600">
            © 2024 Mnemosyne. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}