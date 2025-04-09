import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white py-16 px-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[#121212] z-0 overflow-hidden">
        {/* Grid background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" 
               style={{
                 backgroundImage: 'radial-gradient(#2DD4BF 1px, transparent 1px), radial-gradient(#2DD4BF 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 backgroundPosition: '0 0, 20px 20px'
               }}>
          </div>
        </div>
        
        {/* Animated accent elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#2DD4BF] rounded-full filter blur-[100px] opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -left-20 w-40 h-40 bg-[#A78BFA] rounded-full filter blur-[100px] opacity-20 animate-pulse delay-700"></div>
        <div className="absolute -bottom-20 right-1/3 w-40 h-40 bg-[#F59E0B] rounded-full filter blur-[100px] opacity-10 animate-pulse delay-1000"></div>
      </div>
      
      <main className="container mx-auto max-w-5xl z-10 flex flex-col items-center space-y-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl">
          {/* Logo/Title */}
          <div className="mb-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">
              <span className="text-[#2DD4BF]">Octavia</span> <span className="font-light">Local.</span>Intelligence
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] mx-auto mt-4"></div>
          </div>
          
          {/* Tagline */}
          <h2 className="text-xl md:text-2xl font-mono text-[#9CA3AF] tracking-wide">
            Built for developers
          </h2>
          
          {/* Description */}
          <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mt-6">
            Discover potential clients by finding businesses with no websites and low Google ratings in specific locations. Target businesses that could benefit from your web development services.
          </p>
          
          {/* CTA Button */}
          <div className="mt-8">
            <Button 
              className="bg-[#2DD4BF] hover:bg-opacity-90 text-black font-semibold tracking-wide py-6 px-10 text-lg transition-all duration-300 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
              onClick={() => navigate("/api-key-input")}
            >
              Get Started
            </Button>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12">
          {/* Feature 1 */}
          <Card className="bg-[#1E1E1E] border border-gray-800 p-6 hover:border-[#2DD4BF] transition-all duration-300">
            <div className="h-10 w-10 rounded-md bg-[#2DD4BF] bg-opacity-10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2DD4BF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Target Businesses</h3>
            <p className="text-gray-400">Find businesses with no websites and ratings below 3.5 stars in your target location.</p>
          </Card>
          
          {/* Feature 2 */}
          <Card className="bg-[#1E1E1E] border border-gray-800 p-6 hover:border-[#A78BFA] transition-all duration-300">
            <div className="h-10 w-10 rounded-md bg-[#A78BFA] bg-opacity-10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#A78BFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Interactive Dashboard</h3>
            <p className="text-gray-400">Analyze business data with advanced visualizations and filtering options.</p>
          </Card>
          
          {/* Feature 3 */}
          <Card className="bg-[#1E1E1E] border border-gray-800 p-6 hover:border-[#F59E0B] transition-all duration-300">
            <div className="h-10 w-10 rounded-md bg-[#F59E0B] bg-opacity-10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Export & Connect</h3>
            <p className="text-gray-400">Export business data for your outreach campaigns and connect with potential clients.</p>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="w-full pt-8 mt-16 border-t border-gray-800 text-center">
          <p className="text-gray-500 font-mono text-sm">
            © {new Date().getFullYear()} Octavia Local.Intelligence — Built for developers
          </p>
        </div>
      </main>
    </div>
  );
}
