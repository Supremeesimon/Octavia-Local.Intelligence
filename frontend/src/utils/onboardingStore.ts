import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  geminiApiKey: string;
  location: string;
  businessType: string;
  currentStep: number;
  isLoading: boolean;
  isComplete: boolean;
  
  setGeminiApiKey: (key: string) => void;
  setLocation: (location: string) => void;
  setBusinessType: (type: string) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsComplete: (complete: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>(
  persist(
    (set) => ({
      geminiApiKey: '',
      location: '',
      businessType: '',
      currentStep: 1,
      isLoading: false,
      isComplete: false,
      
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setLocation: (location) => set({ location }),
      setBusinessType: (type) => set({ businessType: type }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsComplete: (complete) => set({ isComplete: complete }),
      reset: () => set({
        geminiApiKey: '',
        location: '',
        businessType: '',
        currentStep: 1,
        isLoading: false,
        isComplete: false,
      }),
    }),
    {
      name: 'octavia-onboarding',
    }
  )
);