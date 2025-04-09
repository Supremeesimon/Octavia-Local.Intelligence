import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import brain from "brain";
import { useOnboardingStore } from "utils/onboardingStore";

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function DebugPanel({ visible, onClose }: DebugPanelProps) {
  const [location, setLocation] = useState("Lethbridge, Alberta");
  const [category, setCategory] = useState("");
  const [rawData, setRawData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { geminiApiKey } = useOnboardingStore();

  if (!visible) return null;

  const fetchRawData = async () => {
    setIsLoading(true);
    try {
      const response = await brain.get_raw_serper_data({
        location,
        category: category || undefined,
        max_results: 100
      });
      
      const data = await response.json();
      setRawData(data);
    } catch (error) {
      console.error("Error fetching raw data:", error);
      toast.error("Failed to fetch data", {
        description: "Error accessing the Serper API"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4 flex items-center justify-center">
      <div className="bg-black border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Debug Panel</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm">Location</label>
            <Input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="e.g. Lethbridge, Alberta"
              className="bg-neutral-900 border-neutral-700"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm">Category (optional)</label>
            <Input 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="e.g. restaurants, plumbers"
              className="bg-neutral-900 border-neutral-700"
            />
          </div>
        </div>
        
        <Button 
          onClick={fetchRawData} 
          disabled={isLoading || !location}
          className="w-full mb-6"
        >
          {isLoading ? "Loading..." : "Fetch Raw Serper API Data"}
        </Button>
        
        {rawData && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Raw Serper API Response</h3>
            <div className="bg-neutral-900 p-4 rounded-md overflow-x-auto" style={{ maxHeight: "500px" }}>
              <pre className="text-xs text-neutral-300">{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
