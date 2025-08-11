export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
          MNEMOSYNE
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl text-purple-200 mb-6 font-light">
          READ INTERVIEWS AT ONE PLACE
        </h2>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Your comprehensive platform for discovering, organizing, and accessing interviews from across the web. 
          From thought leaders to industry experts, find all the conversations that matter in one centralized hub.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl min-w-[140px]">
            Sign Up
          </button>
          
          <button className="border-2 border-purple-400 text-purple-200 hover:bg-purple-600 hover:text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 min-w-[140px]">
            Login
          </button>
        </div>
        
        {/* Decorative Elements */}
        <div className="mt-16 opacity-20">
          <div className="flex justify-center items-center space-x-8">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
}