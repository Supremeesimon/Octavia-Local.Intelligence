import React, { useState, useEffect } from "react";
import { useChatStore } from "utils/chatStore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import L from "leaflet";

// Fix for Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface VisualizationPanelProps {
  isVisible: boolean;
  onRefresh?: () => void;
}

export function VisualizationPanel({ isVisible, onRefresh }: VisualizationPanelProps) {
  // Make sure onRefresh is defined before using it
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  const { businessResults, lastQuery } = useChatStore();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dummy coordinates for map (would be replaced with real coordinates from API)
  const defaultPosition: [number, number] = [49.7, -112.8]; // Approximate coordinates for Lethbridge, Alberta
  
  // Calculate statistics and prioritize businesses
  const totalBusinesses = businessResults.length;
  
  // Prime opportunities: No website AND rating < 3.5
  const primeOpportunities = businessResults.filter(b => b.hasWebsite === false && b.rating !== null && b.rating < 3.5);
  
  // Secondary opportunities: just no website
  const noWebsiteOnly = businessResults.filter(b => b.hasWebsite === false && (b.rating === null || b.rating >= 3.5));
  
  // Secondary opportunities: just low rating
  const lowRatingOnly = businessResults.filter(b => b.hasWebsite === true && b.rating !== null && b.rating < 3.5);
  
  // No opportunity: has website and good/no rating
  const noOpportunity = businessResults.filter(b => b.hasWebsite === true && (b.rating === null || b.rating >= 3.5));
  
  // Counts for charts
  const noWebsiteCount = primeOpportunities.length + noWebsiteOnly.length;
  const lowRatingCount = primeOpportunities.length + lowRatingOnly.length;
  
  // Generate data for the pie charts
  const websiteData = [
    { name: "No Website", value: noWebsiteCount, color: "#2DD4BF" },
    { name: "Has Website", value: totalBusinesses - noWebsiteCount, color: "#A78BFA" }
  ];
  
  // Opportunity classification data
  const opportunityData = [
    { name: "Prime", value: primeOpportunities.length, color: "#F43F5E" }, // Hot leads (both issues)
    { name: "No Website", value: noWebsiteOnly.length, color: "#2DD4BF" }, // Just missing website
    { name: "Low Rating", value: lowRatingOnly.length, color: "#FBBF24" }, // Just low rating
    { name: "None", value: noOpportunity.length, color: "#6B7280" } // No apparent opportunity
  ];
  
  // Generate data for the rating distribution
  const ratingCounts = { "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0, "No Rating": 0 };
  businessResults.forEach(business => {
    if (business.rating === null) {
      ratingCounts["No Rating"]++;
    } else if (business.rating < 2) {
      ratingCounts["1-2"]++;
    } else if (business.rating < 3) {
      ratingCounts["2-3"]++;
    } else if (business.rating < 4) {
      ratingCounts["3-4"]++;
    } else {
      ratingCounts["4-5"]++;
    }
  });
  
  const ratingData = Object.entries(ratingCounts).map(([name, value]) => ({
    name,
    value,
    color: name === "1-2" || name === "2-3" ? "#F59E0B" : 
           name === "No Rating" ? "#A78BFA" : "#2DD4BF"
  }));
  
  // Generate data for categories
  const categoryMap = new Map<string, number>();
  businessResults.forEach(business => {
    const category = business.category || "Uncategorized";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories
  
  // Handler for exporting data
  const handleExport = () => {
    const headers = ["Name", "Rating", "Has Website", "Category"];
    const csvContent = [
      headers.join(","),
      ...businessResults.map(business => [
        `"${business.name.replace(/"/g, '""')}"`,
        business.rating === null ? "" : business.rating,
        business.hasWebsite ? "Yes" : "No",
        business.category ? `"${business.category.replace(/"/g, '""')}"` : ""
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `octavia-business-data-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set animation parameters with useEffect to control mounting/unmounting
  const [animatedVisible, setAnimatedVisible] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      // Start animation after component mounts
      const timer = setTimeout(() => {
        setAnimatedVisible(true);
      }, 100); // Short delay to ensure smooth animation
      return () => clearTimeout(timer);
    } else {
      setAnimatedVisible(false);
    }
  }, [isVisible]);
  
  return (
    <div 
      className={`flex flex-col h-full bg-[#0E0E0E] border-l border-gray-800 p-4 transition-all duration-700 ease-in-out transform ${animatedVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}
      style={{ width: '100%' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Data Analysis</h2>
          <button 
            onClick={handleRefresh}
            className="bg-[#1A1A1A] hover:bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-xs flex items-center gap-1 border border-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <div className="h-2 w-24 bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] rounded-full"></div>
      </div>
      
      {businessResults.length === 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 rounded-lg border border-gray-800 bg-black bg-opacity-40 flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400 mb-2">Visualization area</p>
              <p className="text-sm text-gray-500">Search for businesses to see visualizations</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="p-4 rounded-lg border border-gray-800 bg-black bg-opacity-40">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                <div className="text-4xl font-bold text-[#2DD4BF] mb-2">{totalBusinesses}</div>
                <div className="text-sm text-gray-400">Total Businesses</div>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                <div className="text-4xl font-bold text-[#F59E0B] mb-2">{noWebsiteCount}</div>
                <div className="text-sm text-gray-400">No Website</div>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                <div className="text-4xl font-bold text-[#F43F5E] mb-2">{primeOpportunities.length}</div>
                <div className="text-sm text-gray-400">Prime Opportunities</div>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[#1A1A1A] border border-gray-800">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="charts" className="flex-1">Charts</TabsTrigger>
              <TabsTrigger value="table" className="flex-1">Business Table</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Business Details</TabsTrigger>
              <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Website Presence</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={websiteData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {websiteData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Business Opportunities</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={opportunityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {opportunityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value) => [`${value} businesses`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {categoryData.length > 0 && (
                  <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800 col-span-2">
                    <h3 className="font-semibold text-white mb-4">Opportunity Strategy Map</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-red-900/30 to-black rounded-lg border border-red-900/30">
                        <h4 className="text-red-400 font-bold mb-2">Prime Opportunities</h4>
                        <p className="text-sm text-gray-300">No website + Low rating ({primeOpportunities.length})</p>
                        <div className="mt-2 text-xs text-gray-400">
                          <p className="mb-1">• Highest conversion potential</p>
                          <p className="mb-1">• Show immediate impact correlation</p>
                          <p>• Focus on these clients first</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-teal-900/30 to-black rounded-lg border border-teal-900/30">
                        <h4 className="text-teal-400 font-bold mb-2">Website Opportunities</h4>
                        <p className="text-sm text-gray-300">No website but good/no rating ({noWebsiteOnly.length})</p>
                        <div className="mt-2 text-xs text-gray-400">
                          <p className="mb-1">• Focus on online visibility</p>
                          <p className="mb-1">• Emphasize customer acquisition</p>
                          <p>• Highlight modern web presence</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-amber-900/30 to-black rounded-lg border border-amber-900/30">
                        <h4 className="text-amber-400 font-bold mb-2">Rating Opportunities</h4>
                        <p className="text-sm text-gray-300">Has website but low rating ({lowRatingOnly.length})</p>
                        <div className="mt-2 text-xs text-gray-400">
                          <p className="mb-1">• Focus on brand improvement</p>
                          <p className="mb-1">• Suggest reputation features</p>
                          <p>• Offer review management tools</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-gray-800/30 to-black rounded-lg border border-gray-800/30">
                        <h4 className="text-gray-400 font-bold mb-2">Category Distribution</h4>
                        <div className="space-y-1 mt-2">
                          {categoryData.slice(0, 4).map((cat, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-xs text-gray-300">{cat.name}</span>
                              <span className="text-xs text-gray-400">{cat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="charts" className="mt-4">
              {/* More detailed charts can go here */}
              <div className="space-y-4">
                <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                  <h3 className="font-semibold text-white mb-4">Prime Business Opportunities</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Businesses without website</span>
                      <span className="text-lg font-bold text-teal-400">{noWebsiteCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Businesses with rating &lt; 3.5</span>
                      <span className="text-lg font-bold text-amber-400">{lowRatingCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Prime opportunities (both)</span>
                      <span className="text-lg font-bold text-red-400">{primeOpportunities.length}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-white mb-2 mt-6 border-t border-gray-700 pt-3">Focus on Prime Opportunities</h4>
                  {primeOpportunities.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {primeOpportunities.slice(0, 5).map((business, idx) => (
                        <div key={idx} className="p-3 bg-red-900/20 rounded border border-red-900/40 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{business.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{business.category || "Unknown"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400 font-bold">{business.rating || "N/A"} ★</div>
                            <div className="text-xs text-red-300 mt-1">No Website</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No prime opportunities found in this search</div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="table" className="mt-4">
              <div className="bg-[#1A1A1A] rounded-md border border-gray-800 overflow-hidden">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-white font-bold">Prioritized Business Opportunities</h3>
                  <p className="text-xs text-gray-400 mt-1">Businesses are prioritized based on website presence and ratings</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-black bg-opacity-30 border-b border-gray-700">
                      <th className="p-3 text-left text-sm font-semibold text-gray-300">Business Name</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-300">Rating</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-300">Website</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-300">Category</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-300">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Prime opportunities first (No website AND low rating) */}
                    {primeOpportunities.map((business, index) => (
                      <tr key={`prime-${index}`} 
                        className="border-b border-gray-800 hover:bg-black hover:bg-opacity-30 bg-red-900/20 cursor-pointer"
                        onClick={() => { business.googleMapsUrl && window.open(business.googleMapsUrl, '_blank') }}
                        title="Click to view on Google Maps">
                      
                        <td className="p-3 text-sm text-white">{business.name}</td>
                        <td className="p-3 text-sm text-white">
                          {business.rating !== null ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-red-400">{business.rating}</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${(business.rating / 5) * 100}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-md bg-red-500 bg-opacity-20 text-red-400 text-xs">No</span>
                        </td>
                        <td className="p-3 text-sm text-gray-300">{business.category || "N/A"}</td>
                        <td className="p-3 text-sm"><span className="text-red-400 font-bold">Prime</span></td>
                      </tr>
                    ))}
                    
                    {/* No website opportunities second */}
                    {noWebsiteOnly.map((business, index) => (
                      <tr key={`noweb-${index}`} 
                        className="border-b border-gray-800 hover:bg-black hover:bg-opacity-30 bg-teal-900/10 cursor-pointer"
                        onClick={() => { business.googleMapsUrl && window.open(business.googleMapsUrl, '_blank') }}
                        title="Click to view on Google Maps">
                      
                        <td className="p-3 text-sm text-white">{business.name}</td>
                        <td className="p-3 text-sm text-white">
                          {business.rating !== null ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-emerald-500">{business.rating}</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(business.rating / 5) * 100}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-md bg-teal-500 bg-opacity-20 text-teal-400 text-xs">No</span>
                        </td>
                        <td className="p-3 text-sm text-gray-300">{business.category || "N/A"}</td>
                        <td className="p-3 text-sm"><span className="text-teal-400">No Website</span></td>
                      </tr>
                    ))}
                    
                    {/* Low rating opportunities third */}
                    {lowRatingOnly.map((business, index) => (
                      <tr key={`lowrating-${index}`} 
                        className="border-b border-gray-800 hover:bg-black hover:bg-opacity-30 bg-amber-900/10 cursor-pointer"
                        onClick={() => { business.googleMapsUrl && window.open(business.googleMapsUrl, '_blank') }}
                        title="Click to view on Google Maps">
                      
                        <td className="p-3 text-sm text-white">{business.name}</td>
                        <td className="p-3 text-sm text-white">
                          {business.rating !== null ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-amber-500">{business.rating}</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${(business.rating / 5) * 100}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-md bg-emerald-500 bg-opacity-20 text-emerald-400 text-xs">Yes</span>
                        </td>
                        <td className="p-3 text-sm text-gray-300">{business.category || "N/A"}</td>
                        <td className="p-3 text-sm"><span className="text-amber-400">Low Rating</span></td>
                      </tr>
                    ))}
                    
                    {/* No opportunity businesses last */}
                    {noOpportunity.map((business, index) => (
                      <tr key={`none-${index}`} 
                        className="border-b border-gray-800 hover:bg-black hover:bg-opacity-30 cursor-pointer"
                        onClick={() => { business.googleMapsUrl && window.open(business.googleMapsUrl, '_blank') }}
                        title="Click to view on Google Maps">
                      
                        <td className="p-3 text-sm text-white">{business.name}</td>
                        <td className="p-3 text-sm text-white">
                          {business.rating !== null ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-emerald-500">{business.rating}</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(business.rating / 5) * 100}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-md bg-emerald-500 bg-opacity-20 text-emerald-400 text-xs">Yes</span>
                        </td>
                        <td className="p-3 text-sm text-gray-300">{business.category || "N/A"}</td>
                        <td className="p-3 text-sm"><span className="text-gray-400">None</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800 overflow-hidden">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-white font-bold">Detailed Business Information</h3>
                  <p className="text-xs text-gray-400 mt-1">Contact details, hours, and more information for each business</p>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                  {primeOpportunities.length > 0 ? (
                    <div className="space-y-4 p-3">
                      <h4 className="text-red-400 font-bold border-b border-gray-800 pb-2">Prime Opportunities</h4>
                      {primeOpportunities.map((business, idx) => (
                        <div key={idx} className="p-4 bg-red-900/20 rounded-md border border-red-900/30">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-white">{business.name}</h5>
                            <div className="text-red-400 font-bold">{business.rating || "N/A"} ★</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{business.category || "Unknown category"}</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {business.address && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.address}</div>
                              </div>
                            )}
                            
                            {business.phone && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.phone}</div>
                              </div>
                            )}
                            
                            {business.email && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.email}</div>
                              </div>
                            )}
                            
                            {business.hours && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.hours}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex space-x-2">
                            {business.googleMapsUrl && (
                              <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2DD4BF] underline">Google Maps</a>
                            )}
                            {business.socialMedia && business.socialMedia.length > 0 && business.socialMedia.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#A78BFA] underline">Social Media {i+1}</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : noWebsiteOnly.length > 0 ? (
                    <div className="space-y-4 p-3">
                      <h4 className="text-teal-400 font-bold border-b border-gray-800 pb-2">No Website Opportunities</h4>
                      {noWebsiteOnly.slice(0, 3).map((business, idx) => (
                        <div key={idx} className="p-4 bg-teal-900/20 rounded-md border border-teal-900/30">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-white">{business.name}</h5>
                            <div className="text-teal-400 font-bold">{business.rating || "N/A"} ★</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{business.category || "Unknown category"}</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {business.address && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.address}</div>
                              </div>
                            )}
                            
                            {business.phone && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.phone}</div>
                              </div>
                            )}
                            
                            {business.email && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.email}</div>
                              </div>
                            )}
                            
                            {business.hours && (
                              <div className="flex items-start">
                                <div className="text-gray-500 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-300">{business.hours}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex space-x-2">
                            {business.googleMapsUrl && (
                              <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2DD4BF] underline">Google Maps</a>
                            )}
                            {business.socialMedia && business.socialMedia.length > 0 && business.socialMedia.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#A78BFA] underline">Social Media {i+1}</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No prime opportunities found in this search</div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              <div className="bg-[#1A1A1A] p-4 rounded-md border border-gray-800 h-[400px]">
                <MapContainer 
                  center={defaultPosition} 
                  zoom={13} 
                  style={{ height: "100%", width: "100%", background: "#242424" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Markers would be added here with actual business coordinates */}
                  <Marker position={defaultPosition}>
                    <Popup className="dark-popup">
                      <div className="text-black">
                        <b>Search Area: {lastQuery?.location || 'Unknown'}</b>
                        <p>This is an approximate location. Individual business markers would appear here with the complete implementation.</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Note: In a complete implementation, individual business locations would be shown on the map.
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleExport}
              className="bg-[#2DD4BF] hover:bg-opacity-90 text-black font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
