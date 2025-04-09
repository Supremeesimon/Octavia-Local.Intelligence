import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface BusinessPreview {
  name: string;
  rating?: number | null;
  hasWebsite: boolean;
  category?: string | null;
  reviewCount?: number | null;
  // Additional fields from API
  hours?: string | null;
  socialMedia?: string[] | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceLevel?: string | null;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  businessResults?: BusinessPreview[];
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isLoading,
  businessResults
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  // Function to handle clicking on a business to open Google Maps
  const handleBusinessClick = (googleMapsUrl?: string) => {
    if (googleMapsUrl) {
      // Ensure we're using the direct Google Maps URL to the business
      window.open(googleMapsUrl, '_blank');
    } else {
      // Fallback message if no URL is available
      console.log("No Google Maps URL available for this business");
      // Show toast
      toast.error("No location information", {
        description: "This business doesn't have location information available."
      });
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]" style={{ height: '100%', position: 'relative' }}>
      {/* Chat messages */}
      <div className="flex-1 pb-4" style={{ overflowY: 'auto', height: 'calc(100% - 90px)', maxHeight: 'calc(100% - 90px)' }}>
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${message.role === "user" 
                  ? "bg-[#2DD4BF] bg-opacity-20 text-white rounded-tr-none" 
                  : message.role === "system" 
                    ? "bg-gray-800 text-gray-300 italic" 
                    : "bg-[#1E1E1E] border border-gray-800 text-white rounded-tl-none"
                }`}
              >
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none">  
                  {message.content}
                </ReactMarkdown>
                {/* ONLY show business listings in the FIRST assistant message that is not a greeting or an analysis */
                message.role === "assistant" && 
                // Only show business cards for the FIRST message from the assistant (business analysis response)
                messages.filter(m => m.role === "assistant").indexOf(message) === 0 &&
                // Don't show ANY business cards if ANY assistant message includes these phrases
                !messages.some(m => m.role === "assistant" && (
                  m.content.includes("Business Opportunities:") ||
                  m.content.includes("I found") ||
                  m.content.includes("businesses matching your search") ||
                  m.content.includes("in this specific search for") ||
                  m.content.includes("Rating:") ||
                  m.content.includes("Has website") ||
                  m.content.includes("No website")
                )) &&
                // Only show if we have business results to display
                businessResults && 
                businessResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Separator className="bg-gray-700" />
                    <p className="text-sm text-gray-400 mt-2">Businesses Without Websites:</p>
                    {businessResults
                      .filter(business => !business.hasWebsite) // Only show businesses without websites
                      .map((business, index) => (
                      <Card 
                        key={index} 
                        className="p-3 bg-black bg-opacity-30 border-gray-800 hover:border-[#2DD4BF] cursor-pointer transition-all duration-200" 
                        onClick={() => handleBusinessClick(business.googleMapsUrl)}
                        title="Click to view on Google Maps"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-[#2DD4BF]">{business.name}</p>
                              <p className="text-xs text-gray-400">{business.category || "Uncategorized"}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {business.rating ? (
                                <span className={`text-sm font-medium ${business.rating < 3.5 ? "text-orange-400" : "text-green-400"}`}>
                                  {business.rating.toFixed(1)}
                                  <span className="text-xs text-gray-500 ml-1">({business.rating && business?.reviewCount ? business.reviewCount : 'N/A'} reviews)</span>
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">No rating</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1 mt-2 text-xs text-gray-300">
                            {business.address && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Address:</span>
                                <span>{business.address}</span>
                              </div>
                            )}
                            {business.phone && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Phone:</span>
                                <span>{business.phone}</span>
                              </div>
                            )}
                            {business.email && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Email:</span>
                                <span>{business.email}</span>
                              </div>
                            )}
                            {business.hours && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Hours:</span>
                                <span>{business.hours}</span>
                              </div>
                            )}
                            {(business.latitude && business.longitude) && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Coordinates:</span>
                                <span>{business.latitude}, {business.longitude}</span>
                              </div>
                            )}
                            {business.googleMapsUrl && (
                              <div className="flex items-start">
                                <span className="text-gray-500 w-20 flex-shrink-0">Google CID:</span>
                                <span>{business.googleMapsUrl.split('cid=')[1]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-lg bg-[#1E1E1E] border border-gray-800 text-white rounded-tl-none">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-[#2DD4BF] border-t-transparent animate-spin"></div>
                    <p className="text-[#2DD4BF] font-medium">Processing request...</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2DD4BF] rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Searching businesses</span>
                      <span>Analyzing data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t border-gray-800 bg-[#121212]">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search for businesses (e.g., 'Restaurants in Lethbridge')..."
            className="flex-1 bg-[#1E1E1E] border-gray-700 focus:border-[#2DD4BF] text-white"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="bg-[#2DD4BF] hover:bg-opacity-90 text-black"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
