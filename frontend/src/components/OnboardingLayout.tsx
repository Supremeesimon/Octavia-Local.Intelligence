import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type OnboardingLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  nextDisabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  hideBackButton?: boolean;
  nextLabel?: string;
};

export function OnboardingLayout({
  children,
  title,
  subtitle,
  step,
  totalSteps,
  nextDisabled = false,
  onNext,
  onBack,
  hideBackButton = false,
  nextLabel = "Next",
}: OnboardingLayoutProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (step === 1) {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center">
          {!hideBackButton && (
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-gray-400 hover:text-white mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
          )}
          <h1 className="text-xl font-bold">
            <span className="text-[#2DD4BF]">Octavia</span> <span className="font-light">Local.</span>Intelligence
          </h1>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Step {step} of {totalSteps}</span>
              <span className="text-sm text-gray-400">{Math.floor((step / totalSteps) * 100)}% complete</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-[#0E0E0E] border border-gray-800 rounded-lg p-6 shadow-xl mb-6">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            {subtitle && <p className="text-gray-400 mb-6">{subtitle}</p>}
            {children}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-end">
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className="bg-[#2DD4BF] hover:bg-opacity-90 text-black font-semibold py-2 px-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}