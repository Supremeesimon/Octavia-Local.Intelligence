import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OnboardingLayout } from "components/OnboardingLayout";
import { useOnboardingStore } from "utils/onboardingStore";

export default function LocationInput() {
  const navigate = useNavigate();
  const { location, businessType, setLocation, setBusinessType, setCurrentStep } = useOnboardingStore();
  const [locationValue, setLocationValue] = useState(location);
  const [businessTypeValue, setBusinessTypeValue] = useState(businessType);

  const handleNext = () => {
    if (!locationValue.trim()) {
      toast.error("Location Required", {
        description: "Please enter a location to search for businesses."
      });
      return;
    }

    // Save the values and proceed to the next step
    setLocation(locationValue.trim());
    setBusinessType(businessTypeValue.trim());
    setCurrentStep(3);
    navigate("/loading-screen");
  };

  const handleBack = () => {
    navigate("/api-key-input");
  };

  return (
    <OnboardingLayout
      title="Where should we look?"
      subtitle="Tell us where you want to find potential clients and optionally specify a business type."
      step={2}
      totalSteps={3}
      nextDisabled={!locationValue.trim()}
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Lethbridge, Alberta"
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
            className="bg-[#1A1A1A] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Enter a city, neighborhood, or region to search for businesses</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="business-type">Business Type (Optional)</Label>
          <Input
            id="business-type"
            placeholder="e.g., restaurants, plumbers, gyms"
            value={businessTypeValue}
            onChange={(e) => setBusinessTypeValue(e.target.value)}
            className="bg-[#1A1A1A] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Specify a category to narrow your search</p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
