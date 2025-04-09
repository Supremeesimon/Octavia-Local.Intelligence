import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatInterface } from "components/ChatInterface";
import { VisualizationPanel } from "components/VisualizationPanel";
import { DebugPanel } from "components/DebugPanel";
import { useChatStore, parseUserQuery } from "utils/chatStore";
import { useOnboardingStore } from "utils/onboardingStore";
import brain from "brain";

export default function ChatApp() {
  const navigate = useNavigate();
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const { 
    messages, 
    businessResults, 
    isSearching, 
    isVisualizationVisible,
    addMessage, 
    setIsSearching, 
    setBusinessResults,
    setIsVisualizationVisible,
    setLastQuery
  } = useChatStore();
  
  const { geminiApiKey } = useOnboardingStore();

  const handleSendMessage = useCallback(async (messageText: string) => {
    // Check for debug commands
    if (messageText.trim().toLowerCase() === "/debug" || 
        messageText.trim().toLowerCase() === "show me the api data" ||
        messageText.trim().toLowerCase() === "list all the data serper api provides" ||
        messageText.trim().toLowerCase() === "show api data") {
      setIsDebugPanelVisible(true);
      return;
    }
    // Add user message to state
    addMessage({
      role: "user",
      content: messageText
    });
    
    setIsSearching(true);
    
    try {
      // Parse the user input to extract potential location and category
      const query = parseUserQuery(messageText);
      
      // Check if it looks like a location search or visualization request
      const isLocationSearch = messageText.toLowerCase().includes("in ") || 
                               messageText.toLowerCase().includes("near ") ||
                               messageText.toLowerCase().includes("find ") ||
                               messageText.toLowerCase().includes("search ") ||
                               messageText.toLowerCase().includes("businesses") ||
                               messageText.toLowerCase().includes("show ");
                               
      // Check if it's a chart/visualization request
      const isChartRequest = messageText.toLowerCase().includes("chart") ||
                             messageText.toLowerCase().includes("visualization") ||
                             messageText.toLowerCase().includes("graph") ||
                             messageText.toLowerCase().includes("display data");
      
      // Check if this is a chart request without prior search data
      if (isChartRequest && businessResults.length === 0) {
        // Handle chart request when no search has been performed
        addMessage({
          role: "assistant",
          content: "I'd be happy to generate charts and visualizations of the business data! First, I need to complete a business search so we have data to work with. Please provide a location (e.g., 'Boston, MA') and optionally a business category, and then I can create visualizations from those results."
        });
        setIsSearching(false);
        return;
      }
      
      // If we have business data and the user requests charts, show visualization panel
      if (isChartRequest && businessResults.length > 0) {
        setIsVisualizationVisible(true);
        addMessage({
          role: "assistant",
          content: "I've displayed the visualization panel with charts and analysis of the business data. You'll find various graphs showing business opportunities by category, rating distribution, and prime targets for your outreach."
        });
        setIsSearching(false);
        return;
      }
      
      // Check if the query is too vague (missing location or has very short location)
      const isVague = isLocationSearch && (!query.location || query.location.length < 3);
      
      if (isVague) {
        // Ask for clarification
        addMessage({
          role: "assistant",
          content: "I need a bit more information to help you find business opportunities. Could you please specify a location? For example: 'cafes in Manhattan' or 'plumbers in San Diego'."
        });
        setIsSearching(false);
        return;
      }
      
      if (isLocationSearch) {
        setLastQuery(query);
        
        // Make API call to search businesses
        try {
          // Define this variable in a higher scope so it can be used throughout the try block
          let businessContext = "";
          
          const response = await brain.search_local_businesses({
            location: query.location,
            category: query.category,
            max_results: 100, // Maximum allowed by API - displaying all available results
            filter_no_website: false, // We'll prioritize in our visualization instead
            max_rating: undefined // We'll prioritize in our visualization instead
          });
          
          const data = await response.json();
          console.log("Search results:", data); // Log for debugging
          
          // Don't show visualization panel yet - wait until data processing is complete
          
          // Process businesses to ensure has_website is a boolean, not undefined or null
          const processedBusinesses = data.businesses.map(b => ({
            ...b,
            has_website: b.has_website === true // Force undefined/null to be false
          }));
          
          // Set processed business results
          setBusinessResults(processedBusinesses);
          
          // Apply our prioritized filtering for the analysis
          // First, prioritize businesses with no website and rating < 3.5
          const primeOpportunities = processedBusinesses.filter(b => !b.has_website && b.rating !== null && b.rating < 3.5);
          
          // Second, businesses with just no website
          const noWebsiteOpportunities = processedBusinesses.filter(b => !b.has_website && (b.rating === null || b.rating >= 3.5));
          
          // Third, businesses with just low rating
          const lowRatingOpportunities = processedBusinesses.filter(b => b.has_website && b.rating !== null && b.rating < 3.5);
          
          // Count stats
          const noWebsiteCount = primeOpportunities.length + noWebsiteOpportunities.length;
          const lowRatingCount = primeOpportunities.length + lowRatingOpportunities.length;
          
          // Get Gemini to generate a helpful response about the business data
          if (data.businesses.length === 0) {
            businessContext = `I searched for businesses in ${query.location}${query.category ? ` in the ${query.category} category` : ''}. I couldn't find any matches.`;
          } else {
            businessContext = `I found ${data.businesses.length} businesses in ${query.location}${query.category ? ` for '${query.category}'` : ''}. `;
            businessContext += `${noWebsiteCount} businesses don't have a website and ${lowRatingCount} have ratings below 3.5 stars.`;
            businessContext += `\n\nPRIME OPPORTUNITIES (no website AND rating < 3.5): ${primeOpportunities.length}`;
            businessContext += `\nSECONDARY OPPORTUNITIES (either no website OR rating < 3.5): ${noWebsiteOpportunities.length + lowRatingOpportunities.length}`;
            
            // Include some business details, prioritizing the best opportunities first
            businessContext += `\n\nExamples of top opportunities I found:\n`;
            
            // First show prime opportunities
            const businessesToShow = [...primeOpportunities];
            
            // If we need more, add no website opportunities
            if (businessesToShow.length < 3) {
              businessesToShow.push(...noWebsiteOpportunities.slice(0, 3 - businessesToShow.length));
            }
            
            // If we still need more, add low rating opportunities
            if (businessesToShow.length < 3) {
              businessesToShow.push(...lowRatingOpportunities.slice(0, 3 - businessesToShow.length));
            }
            
            // If we still need more, add remaining businesses
            if (businessesToShow.length < 3) {
              const remainingBusinesses = data.businesses.filter(b => 
                b.has_website && (b.rating === null || b.rating >= 3.5));
              businessesToShow.push(...remainingBusinesses.slice(0, 3 - businessesToShow.length));
            }
            
            // Show the businesses
            businessesToShow.slice(0, 3).forEach((business, index) => {
              businessContext += `${index + 1}. ${business.name} - `;
              businessContext += business.rating ? `Rating: ${business.rating}/5` : "No rating";
              businessContext += business.has_website ? " (Has website)" : " (No website)";
              businessContext += "\n";
            });
          }
          
          // Use Gemini to generate a response with more intelligent business analysis
          try {
            const geminiResponse = await brain.generate_gemini_response({
              api_key: geminiApiKey,
              model: "gemini-2.0-pro", // Explicitly use Gemini 2.0 as requested
              prompt: `You are Octavia, an AI assistant for a service called "Octavia Local.Intelligence" that helps web developers identify potential clients by finding businesses with no websites and low Google ratings in specific locations. You operate with a noir-themed, direct, and analytical communication style.

You've just performed a search for the user and found the following information:\n\n${businessContext}\n\n
CRITICAL FORMATTING INSTRUCTIONS:
- KEEP YOUR ENTIRE RESPONSE UNDER 300 CHARACTERS - this is critical
- End with a single focused follow-up question
- Use short, punchy sentences
- Focus only on key insights, not data repetition
- DO NOT use headings, lists, or bulleted points
- DO NOT repeat business names that are already shown in the UI

Give a very brief, focused assessment of the top opportunity and ONE specific next step. End with a single relevant follow-up question to engage the user further.`,
              temperature: 0.7
            });
            
            const geminiData = await geminiResponse.json();
            
            // Only now show the visualization panel after processing is complete
            setIsVisualizationVisible(true);
            
            // Add assistant response to state
            addMessage({
              role: "assistant",
              content: geminiData.text
            });
          } catch (geminiError) {
            console.error("Error in Gemini API call:", geminiError);
            
            // Special handling for quota exceeded errors
            if (geminiError.toString().includes("quota exceeded") || geminiError.toString().includes("429")) {
              addMessage({
                role: "assistant",
                content: "I apologize, but it looks like the Gemini API quota has been exceeded. Please try again later or use a different API key. You can update your API key by clicking on 'New Search' and going through the setup process again."
              });
            } else {
              addMessage({
                role: "assistant",
                content: "I encountered an error analyzing the business data. However, I've still displayed the visualization panel with the business opportunities I found."
              });
            }
            
            // Still show visualization panel with the business data we have
            setIsVisualizationVisible(true);
          }
        } catch (searchError) {
          console.error("Error in search API call:", searchError);
          toast.error("Search failed", {
            description: "There was a problem searching for businesses. Please try again."
          });
          
          addMessage({
            role: "assistant",
            content: "Sorry, I encountered an error while searching for businesses. Please try again with a different location or category."
          });
        }
      } else {
        // For non-location queries, use Gemini as a general assistant
        // Get all previous messages for context
        const messageHistory = messages.map(msg => `${msg.role}: ${msg.content}`).join("\n");
        
        // Use Gemini to generate a response
        try {
          const geminiResponse = await brain.generate_gemini_response({
            api_key: geminiApiKey,
            model: "gemini-2.0-pro", // Explicitly use Gemini 2.0 as requested
            prompt: `You are Octavia, an AI assistant for a service called "Octavia Local.Intelligence" that helps web developers identify potential clients by finding businesses with no websites and low Google ratings in specific locations. The user has sent you a message that doesn't appear to be a location search. Respond helpfully to their query while gently guiding them back to the main function of searching for business opportunities if appropriate.\n\nChat history:\n${messageHistory}\n\nUser's message: ${messageText}\n\nIMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT include generic instructions on how to use the app unless specifically asked
- DO NOT start your response with "Hello" or similar greeting
- DO NOT use asterisks (*) for emphasis as it breaks formatting - use quotes or other formatting instead
- Remain concise and to the point
- Avoid repetitive content within your answer
- FOCUS only on answering the user's specific question

GUIDELINES FOR SPECIFIC SCENARIOS:
1. If the user is asking about helping businesses with low ratings or no website, provide 2-3 specific actionable recommendations they can implement, not just general advice.

2. If the user is asking how to approach or contact businesses, suggest a specific outreach template or strategy they can use immediately.

3. If the user is expressing frustration with the app or results, acknowledge their concern and suggest a concrete alternative approach they can try right away.

Always end your response with a clear suggestion for what the user should do next, whether that's a new search, a business outreach strategy, or another concrete action.

Respond in a helpful, concise way that's appropriate to the user's query, always providing forward-looking advice on next steps.`,
            temperature: 0.7
          });
          
          const geminiData = await geminiResponse.json();
          
          // Add assistant response to state
          addMessage({
            role: "assistant",
            content: geminiData.text
          });
        } catch (geminiError) {
          console.error("Error in Gemini API call:", geminiError);
          
          // Special handling for quota exceeded errors
          if (geminiError.toString().includes("quota exceeded") || geminiError.toString().includes("429")) {
            addMessage({
              role: "assistant",
              content: "I apologize, but it looks like the Gemini API quota has been exceeded. Please try again later or use a different API key. You can update your API key by clicking on 'New Search' and going through the setup process again."
            });
          } else {
            addMessage({
              role: "assistant",
              content: "I encountered an error processing your request. Please try again later."
            });
          }
        }
      }
    } catch (error) {
      console.error("Error searching for businesses:", error);
      
      let errorMsg = "Sorry, I encountered an error while searching for businesses. Please try again.";
      
      // Special handling for quota exceeded errors
      if (error.toString().includes("quota exceeded") || error.toString().includes("429")) {
        errorMsg = "I apologize, but it looks like the Gemini API quota has been exceeded. Please try again later or use a different API key. You can update your API key by clicking on 'New Search' and going through the setup process again.";
      }
      
      // Show error toast
      toast.error("Search failed", {
        description: error.toString().includes("429") ? 
          "Gemini API quota exceeded. Please try again later or use a different API key." :
          "There was a problem searching for businesses. Please try again."
      });
      
      addMessage({
        role: "assistant",
        content: errorMsg
      });
    } finally {
      setIsSearching(false);
    }
  }, [addMessage, setIsSearching, setBusinessResults, setIsVisualizationVisible, setLastQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Debug Panel */}
      <DebugPanel 
        visible={isDebugPanelVisible} 
        onClose={() => setIsDebugPanelVisible(false)} 
      />
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 
            className="text-xl font-bold cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <span className="text-[#2DD4BF]">Octavia</span> <span className="font-light">Local.</span>Intelligence
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              // Reset the onboarding state to be incomplete and at step 2
              useOnboardingStore.getState().setCurrentStep(2);
              useOnboardingStore.getState().setIsComplete(false);
              
              // Reset chat state
              setBusinessResults([]);
              setIsVisualizationVisible(false);
              useChatStore.getState().reset();
              
              // Show toast message
              toast.success("Starting a new search", {
                description: "Taking you back to the location selection screen."
              });
              
              // Navigate to the location input page (step 2 of onboarding)
              navigate("/location-input");
            }}
            variant="outline"
            size="sm"
            className="text-[#2DD4BF] border-[#2DD4BF] hover:bg-[#2DD4BF]/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Search
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Split screen layout */}
        <div className="flex flex-1 h-full">
          {/* Left panel - Chat interface */}
          <div className={`flex-1 transition-all duration-500 ease-in-out ${isVisualizationVisible ? 'w-1/2 border-r border-gray-800' : 'w-full'}`} 
               style={{ height: 'calc(100vh - 66px)', overflowY: 'auto', maxHeight: 'calc(100vh - 66px)', position: 'relative' }}> {/* Independent scrolling with fixed height */}
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isSearching}
              businessResults={businessResults}
            />
          </div>
          
          {/* Right panel - Visualization canvas - rendered but hidden until ready */}
          <div 
            className={`w-1/2 flex-1 transition-all duration-700 ease-in-out transform ${isVisualizationVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute right-0'}`} 
            style={{ height: 'calc(100vh - 66px)', overflowY: 'auto', maxHeight: 'calc(100vh - 66px)', position: isVisualizationVisible ? 'relative' : 'absolute' }}
          >
              <VisualizationPanel 
                isVisible={isVisualizationVisible} 
                onRefresh={() => {
                  // Clear business results
                  setBusinessResults([]);
                  // Hide visualization panel
                  setIsVisualizationVisible(false);
                  // Add a message asking for a new search
                  addMessage({
                    role: "assistant",
                    content: "What location would you like to search for business opportunities?"
                  });
                }}
              />
            </div>
        </div>
      </main>
    </div>
  );
}
