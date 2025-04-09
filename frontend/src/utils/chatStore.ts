import { create } from 'zustand';
import { BusinessPreview, ChatMessage } from 'components/ChatInterface';
import { BusinessData } from 'types';

// Simple ID generator since we don't have UUID
let messageId = 0;
const generateId = () => `msg-${messageId++}`;

// Initial welcome messages
const initialMessages: ChatMessage[] = [
  {
    id: generateId(),
    role: "system",
    content: "Welcome to Octavia Local.Intelligence. I'm here to help you discover potential web development clients.",
    timestamp: new Date()
  },
  {
    id: generateId(),
    role: "assistant",
    content: "Hello! I can help you find businesses that could benefit from your web development services. Please provide a location to search (e.g., 'Lethbridge, Alberta') and optionally a business category (e.g., 'restaurants', 'plumbers').",
    timestamp: new Date()
  }
];

interface ChatState {
  messages: ChatMessage[];
  businessResults: BusinessPreview[];
  isSearching: boolean;
  isVisualizationVisible: boolean;
  lastQuery: { location: string; category?: string } | null;
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setBusinessResults: (results: BusinessData[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsVisualizationVisible: (isVisible: boolean) => void;
  setLastQuery: (query: { location: string; category?: string } | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: initialMessages,
  businessResults: [],
  isSearching: false,
  isVisualizationVisible: false,
  lastQuery: null,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: generateId(),
      timestamp: new Date()
    }]
  })),
  
  setBusinessResults: (results) => {
    // Create a map to track businesses we've already seen (by name)
    const seen = new Map();
    
    return set(() => ({
      businessResults: results
        .map(business => ({
          name: business.name,
          rating: business.rating,
          hasWebsite: business.has_website === true, // Explicitly check with ===
          category: business.category,
          reviewCount: business.reviews_count,
          // Add more data from API response
          hours: business.business_hours,
          socialMedia: business.social_media,
          email: business.email,
          phone: business.contact?.phone,
          address: business.contact?.address,
          website: business.contact?.website,
          googleMapsUrl: business.google_maps_url,
          // Additional requested fields
          latitude: business.latitude,
          longitude: business.longitude,
          priceLevel: business.price_level
        }))
        // Filter out duplicate businesses by name
        .filter(business => {
          if (seen.has(business.name)) {
            return false;
          }
          seen.set(business.name, true);
          return true;
        })
    }));
  },
  
  setIsSearching: (isSearching) => set(() => ({ isSearching })),
  
  setIsVisualizationVisible: (isVisible) => set(() => ({ isVisualizationVisible: isVisible })),
  
  setLastQuery: (query) => set(() => ({ lastQuery: query })),
  
  reset: () => set(() => ({
    messages: initialMessages,
    businessResults: [],
    isSearching: false,
    isVisualizationVisible: false,
    lastQuery: null
  }))
}));

// Parse user input to extract location and category
export const parseUserQuery = (input: string): { location: string; category?: string } => {
  // Check if the input is asking for chart/visualization
  const chartPattern = /(show|display|create|generate|give me)\s+(a |some |)(chart|charts|visualization|visualizations|graph|graphs)/i;
  const chartMatch = input.match(chartPattern);
  if (chartMatch) {
    // For chart requests with no prior search, return empty location to trigger guidance response
    return { location: "" };
  }
  
  // Common patterns:
  // 1. "Category in Location" - e.g., "restaurants in Lethbridge"
  // 2. "Category near Location" - e.g., "restaurants near Lethbridge"
  // 3. "in Location" - e.g., "in Lethbridge" (should just be location)
  // 4. Only location - e.g., "Lethbridge"
  
  // Handle special case: "in Location"
  const justInPattern = /^\s*in\s+(.+)$/i;
  const justInMatch = input.match(justInPattern);
  if (justInMatch) {
    return { location: justInMatch[1].trim() };
  }

  // Handle "Category in/near Location"
  const inNearPattern = /(.+?)\s+(in|near)\s+(.+)/i;
  const match = input.match(inNearPattern);
  if (match) {
    const category = match[1].trim();
    const location = match[3].trim();
    return { location, category };
  }
  
  // Handle "Find/search Category in/near Location"
  const findPattern = /(?:find|search for|search|show me|show|get)\s+(.+?)\s+(?:in|near)\s+(.+)/i;
  const findMatch = input.match(findPattern);
  if (findMatch) {
    const category = findMatch[1].trim();
    const location = findMatch[2].trim();
    return { location, category };
  }
  
  // Handle "Find/search Location"
  const findLocationPattern = /(?:find|search for|search|show me|show|get|look in|look at)\s+(.+)/i;
  const findLocationMatch = input.match(findLocationPattern);
  if (findLocationMatch) {
    const potentialLocation = findLocationMatch[1].trim();
    // Check if it looks like a location (e.g., has city/state patterns)
    if (potentialLocation.match(/[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?/) ||
        potentialLocation.match(/[A-Z]{2}/) ||
        potentialLocation.includes(',')) {
      return { location: potentialLocation };
    }
  }
  
  // If we're here, assume it's just a location
  return { location: input.trim() };
};
