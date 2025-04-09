import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { DEFAULT_THEME } from "../constants/default-theme";
import { OnboardingRoutes } from "./OnboardingRoutes";
import { useOnboardingStore } from "../utils/onboardingStore";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { geminiApiKey, location: searchLocation, isComplete } = useOnboardingStore();
  
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add(DEFAULT_THEME);
  }, []);
  
  // Check if onboarding is complete and redirect to chat app if needed
  useEffect(() => {
    // Only apply this logic when we're at paths related to API key or location input
    if (location.pathname === "/api-key-input" || location.pathname === "/location-input") {
      // If we already have an API key and location AND onboarding is marked complete, go straight to the chat app
      if (geminiApiKey && searchLocation && isComplete) {
        navigate("/chat-app");
      }
    }
    
    // If we're at the root and have completed onboarding before, go to the chat app
    if (location.pathname === "/" && isComplete && geminiApiKey && searchLocation) {
      navigate("/chat-app");
    }
  }, [location.pathname, geminiApiKey, searchLocation, isComplete, navigate]);
  return (
    <>
      <OnboardingRoutes />
      {children}
      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#1E1E1E",
            color: "#FFFFFF",
            border: "1px solid #333333"
          }
        }}
      />
    </>
  );
}
