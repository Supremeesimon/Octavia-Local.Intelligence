import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from "components/ChatInterface";

export const createSystemMessage = (content: string): ChatMessage => ({
  id: uuidv4(),
  role: "system",
  content,
  timestamp: new Date()
});

export const createUserMessage = (content: string): ChatMessage => ({
  id: uuidv4(),
  role: "user",
  content,
  timestamp: new Date()
});

export const createAssistantMessage = (content: string): ChatMessage => ({
  id: uuidv4(),
  role: "assistant",
  content,
  timestamp: new Date()
});

export const getInitialMessages = (): ChatMessage[] => [
  createSystemMessage("Welcome to Octavia Local.Intelligence. I'm here to help you discover potential web development clients."),
  createAssistantMessage("Hello! I can help you find businesses that could benefit from your web development services. Please provide a location to search (e.g., 'Lethbridge, Alberta') and optionally a business category (e.g., 'restaurants', 'plumbers')."),
];

// Parse user input to extract location and category
export const parseUserQuery = (input: string): { location: string; category?: string } => {
  // Common patterns:
  // 1. "Category in Location" - e.g., "restaurants in Lethbridge"
  // 2. "Category near Location" - e.g., "restaurants near Lethbridge"
  // 3. Only location - e.g., "Lethbridge"
  
  const inNearPattern = /(.+?)\s+(in|near)\s+(.+)/i;
  const match = input.match(inNearPattern);
  
  if (match) {
    const category = match[1].trim();
    const location = match[3].trim();
    return { location, category };
  }
  
  // If no pattern match, assume it's just a location
  return { location: input.trim() };
};
