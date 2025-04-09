import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OnboardingLayout } from "components/OnboardingLayout";
import { useOnboardingStore } from "utils/onboardingStore";
import brain from "brain";

export default function ApiKeyInput() {
  const navigate = useNavigate();
  const { geminiApiKey, setGeminiApiKey, setCurrentStep } = useOnboardingStore();
  const [apiKey, setApiKey] = useState(geminiApiKey);
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = async () => {
    if (!apiKey.trim()) {
      toast.error("API Key Required", {
        description: "Please enter your Gemini API key to continue."
      });
      return;
    }

    setIsValidating(true);

    try {
      // Validate the API key
      const response = await brain.validate_gemini_api_key({
        api_key: apiKey.trim()
      });
      
      const data = await response.json();
      
      if (data.is_valid) {
        // Save the API key and proceed to the next step
        setGeminiApiKey(apiKey.trim());
        setCurrentStep(2);
        navigate("/location-input");
      } else {
        toast.error("Invalid API Key", {
          description: "The API key you entered is not valid. Please check and try again."
        });
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      toast.error("Validation Error", {
        description: "There was a problem validating your API key. Please try again."
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <OnboardingLayout
      title="Enter your Gemini API Key"
      subtitle="You'll need a Gemini API key to use our AI-powered features. This will be used for all chat and analysis functionality."
      step={1}
      totalSteps={3}
      nextDisabled={isValidating || !apiKey.trim()}
      onNext={handleNext}
      nextLabel={isValidating ? "Validating..." : "Next"}
      hideBackButton={false}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#1A1A1A] border-gray-700 text-white"
            autoComplete="off"
          />
        </div>
        <div className="bg-[#1A1A1A] p-3 rounded-md border border-gray-700">
          <p className="text-xs text-gray-400">
            Don't have a Gemini API key? You can get one at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-[#2DD4BF] hover:underline">https://ai.google.dev/</a>
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
