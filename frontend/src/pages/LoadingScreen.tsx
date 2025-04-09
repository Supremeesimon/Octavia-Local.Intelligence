import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "components/OnboardingLayout";
import { useOnboardingStore } from "utils/onboardingStore";
import { useChatStore } from "utils/chatStore";
import brain from "brain";

export default function LoadingScreen() {
  const navigate = useNavigate();
  const { geminiApiKey, location, businessType, setIsLoading, setIsComplete } = useOnboardingStore();
  const { addMessage, setBusinessResults, setIsVisualizationVisible, setLastQuery } = useChatStore();

  useEffect(() => {
    const searchBusinesses = async () => {
      try {
        // Make API call to search businesses
        const response = await brain.search_local_businesses({
          location: location,
          category: businessType || undefined,
          max_results: 10,
          filter_no_website: false,
          max_rating: undefined
        });
        
        const data = await response.json();
        
        // Set business results in the chat store
        setBusinessResults(data.businesses);
        setIsVisualizationVisible(true);
        setLastQuery({ location, category: businessType || undefined });
        
        // Generate context for Gemini
        let businessContext = "";
        if (data.businesses.length === 0) {
          businessContext = `I searched for businesses in ${location}${businessType ? ` in the ${businessType} category` : ''}. I couldn't find any matches.`;
        } else {
          const noWebsiteCount = data.businesses.filter(b => !b.has_website).length;
          const lowRatingCount = data.businesses.filter(b => b.rating !== null && b.rating < 3.5).length;
          
          businessContext = `I found ${data.businesses.length} businesses in ${location}${businessType ? ` for '${businessType}'` : ''}. `;
          businessContext += `${noWebsiteCount} businesses don't have a website and ${lowRatingCount} have ratings below 3.5 stars.`;
          
          // Include some business details
          businessContext += "\n\nHere are some businesses I found:\n";
          data.businesses.slice(0, 3).forEach((business, index) => {
            businessContext += `${index + 1}. ${business.name} - `;
            businessContext += business.rating ? `Rating: ${business.rating}/5` : "No rating";
            businessContext += business.has_website ? " (Has website)" : " (No website)";
            businessContext += "\n";
          });
        }
        
        // Use Gemini to generate a response
        const geminiResponse = await brain.generate_gemini_response({
          api_key: geminiApiKey,
          model: "gemini-2.0-pro", // Explicitly use Gemini 2.0 as requested
          prompt: `You are Octavia, an AI assistant for a service called "Octavia Local.Intelligence" that helps web developers identify potential clients by finding businesses with no websites and low Google ratings in specific locations. This is the first message you're sending to the user after they've searched for: ${businessType ? businessType + " in " : ""}${location}\n\nHere's the information you've found:\n\n${businessContext}\n\nIMPORTANT FORMATTING INSTRUCTIONS:
- KEEP YOUR ENTIRE RESPONSE UNDER 300 CHARACTERS - this is critical
- End with a single follow-up question focused on next steps
- DO NOT include any section headings or lists
- DO NOT repeat business information
- Focus only on key insights and opportunities
- Use short, punchy sentences

Write an extremely concise message that highlights the best opportunities for web development clients.`,
          temperature: 0.7
        });
        
        const geminiData = await geminiResponse.json();
        
        // Add the generated message
        addMessage({
          role: "assistant",
          content: geminiData.text
        });
        
        // Mark onboarding as complete
        setIsComplete(true);
        setIsLoading(false);
        
        // Store this information to ensure the app knows we're done onboarding
        localStorage.setItem('onboarding-complete', 'true');
        
        // Navigate to the chat app
        navigate("/chat-app");
        
      } catch (error) {
        console.error("Error during search:", error);
        // Handle error and navigate back to location input
        setIsLoading(false);
        navigate("/location-input");
      }
    };

    // Start the search process
    setIsLoading(true);
    searchBusinesses();
  }, []);

  const handleBack = () => {
    navigate("/location-input");
  };

  return (
    <OnboardingLayout
      title="Searching for Opportunities"
      subtitle="We're scanning the area for businesses that could benefit from your web development services."
      step={3}
      totalSteps={3}
      nextDisabled={true}
      onBack={handleBack}
      hideBackButton={true}
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] opacity-20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] opacity-50"></div>
          <div className="absolute inset-4 rounded-full bg-[#0E0E0E] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#2DD4BF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold">Scanning {location}</p>
          <p className="text-sm text-gray-400">{businessType ? `Looking for ${businessType} businesses` : 'Searching all business types'}</p>
        </div>

        <div className="w-full max-w-xs mt-8">
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] w-full animate-progressbar"></div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
