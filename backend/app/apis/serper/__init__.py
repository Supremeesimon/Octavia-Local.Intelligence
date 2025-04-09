from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends, Query
from pydantic import BaseModel, Field
import http.client
import json
import databutton as db
from tenacity import retry, stop_after_attempt, wait_exponential
import time

# Get the API key
SERPER_API_KEY = db.secrets.get("SERPER_API_KEY")
# Not needed with http.client approach

# Create router
router = APIRouter()

# Rate limiter
LAST_REQUEST_TIME = 0
MIN_REQUEST_INTERVAL = 1  # 1 second between requests

# Models
class BusinessFilterRequest(BaseModel):
    location: str = Field(..., description="Location to search for businesses (e.g. 'Lethbridge, Alberta')")
    category: Optional[str] = Field(None, description="Optional category to filter businesses (e.g. 'restaurants', 'cafes')")
    max_results: Optional[int] = Field(100, description="Maximum number of results to return", ge=1, le=100)
    filter_no_website: Optional[bool] = Field(False, description="Filter to only include businesses with no website")
    max_rating: Optional[float] = Field(None, description="Filter to only include businesses with rating below this value", ge=0, le=5)

class BusinessContact(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None

class BusinessData(BaseModel):
    name: str
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    has_website: bool = False
    category: Optional[str] = None
    contact: BusinessContact
    google_maps_url: Optional[str] = None
    image_url: Optional[str] = None
    business_hours: Optional[str] = None
    social_media: Optional[List[str]] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_level: Optional[str] = None

class BusinessSearchResponse(BaseModel):
    businesses: List[BusinessData]
    total_count: int
    timestamp: float

# Helper functions
def rate_limit():
    """Simple rate limiter to prevent too many requests"""
    global LAST_REQUEST_TIME
    current_time = time.time()
    time_since_last_request = current_time - LAST_REQUEST_TIME
    
    if time_since_last_request < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - time_since_last_request)
    
    LAST_REQUEST_TIME = time.time()

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def search_businesses(query: str) -> Dict[str, Any]:
    """Search for businesses using Serper API with retry logic"""
    rate_limit()  # Apply rate limiting
    
    try:
        # Use the dedicated places endpoint which provides more detailed local business information
        conn = http.client.HTTPSConnection("google.serper.dev")
        
        # URL encode the query
        # Format: /places?q=query&apiKey=key
        encoded_query = query.replace(" ", "+")
        endpoint = f"/places?q={encoded_query}&apiKey={SERPER_API_KEY}"
        
        # Make the request
        conn.request("GET", endpoint, "", {})
        response = conn.getresponse()
        data = response.read()
        
        if response.status != 200:
            raise HTTPException(status_code=response.status, detail=f"Serper API error: {data.decode('utf-8')}")
        
        return json.loads(data.decode("utf-8"))
    except http.client.HTTPException as e:
        raise HTTPException(status_code=500, detail=f"HTTP connection error: {str(e)}") from e
    finally:
        if 'conn' in locals():
            conn.close()

def extract_business_data(search_results: Dict[str, Any], max_results: int, filter_no_website: bool = False, max_rating: Optional[float] = None) -> List[BusinessData]:
    """Extract relevant business data from search results"""
    businesses = []
    
    # Check if places results are present
    if "places" not in search_results or not search_results["places"]:
        return businesses
    
    # Process and filter places results
    for item in search_results["places"]:
        # Stop if we've reached the max results
        if len(businesses) >= max_results:
            break
            
        # Check if the business has a website
        has_website = "website" in item and bool(item["website"])
        
        # Skip if we're filtering for no website and this business has one
        if filter_no_website and has_website:
            continue
            
        # Extract rating for filtering
        rating = None
        if "rating" in item:
            try:
                rating = float(item["rating"])
                # Skip if we're filtering by max rating and this business exceeds it
                if max_rating is not None and rating > max_rating:
                    continue
            except (ValueError, TypeError):
                pass
                
        # Extract reviews count
        reviews_count = item.get("ratingCount")
        
        # Extract business hours
        business_hours = None
        if "workingHours" in item:
            business_hours = item.get("workingHours")
            
        # Extract email
        email = None
        if "serviceOptions" in item and isinstance(item["serviceOptions"], dict):
            email = item["serviceOptions"].get("email")
        
        # Extract social media links
        social_media = []
        if "socialMedia" in item and isinstance(item["socialMedia"], dict):
            for platform, url in item["socialMedia"].items():
                if url and isinstance(url, str):
                    social_media.append(url)
        
        # Create contact info
        contact = BusinessContact(
            phone=item.get("phoneNumber"),
            address=item.get("address"),
            website=item.get("website") if has_website else None
        )
        
        # Get image URL if available
        image_url = item.get("thumbnailUrl")
        
        # Create Google Maps URL from place ID (preferred) or coordinates
        google_maps_url = None
        if "placeId" in item and item.get("placeId"):
            # This is the standard format for Google Maps place URLs
            google_maps_url = f"https://www.google.com/maps/place/?q=place_id:{item.get('placeId')}"
        # Fallback to cid if placeId is not available
        elif "cid" in item and item.get("cid"):
            # For cid, we should use a slightly different format
            google_maps_url = f"https://maps.google.com/?cid={item.get('cid')}"
        # Final fallback to coordinates
        elif "latitude" in item and "longitude" in item:
            lat = item.get("latitude")
            lng = item.get("longitude")
            # Use the standard coordinates format
            google_maps_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
            # If we have a title, add it to the URL
            if "title" in item:
                title = item.get("title", "Business").replace(" ", "+")
                google_maps_url = f"https://www.google.com/maps/search/{title}/@{lat},{lng},15z/"
        
        # Extract latitude and longitude
        latitude = None
        longitude = None
        if "latitude" in item and "longitude" in item:
            try:
                latitude = float(item.get("latitude"))
                longitude = float(item.get("longitude"))
            except (ValueError, TypeError):
                pass
                
        # Extract price level
        price_level = None
        if "priceLevel" in item:
            price_level = item.get("priceLevel")
            
        # Create business data
        business = BusinessData(
            name=item.get("title", "Unknown"),
            rating=rating,
            reviews_count=reviews_count,
            has_website=has_website,
            category=item.get("category"),
            contact=contact,
            google_maps_url=google_maps_url,
            image_url=image_url,
            business_hours=business_hours,
            social_media=social_media if social_media else None,
            email=email,
            latitude=latitude,
            longitude=longitude,
            price_level=price_level
        )
        
        businesses.append(business)
    
    return businesses

# Endpoints
@router.post("/raw-serper-data")
def get_raw_serper_data(request: BusinessFilterRequest):
    """Get raw data from Serper API for debugging purposes"""
    try:
        # Build search query in "Category in location" format
        query = f"Businesses in {request.location}"
        if request.category:
            query = f"{request.category} in {request.location}"
        
        # Log the query for debugging
        print(f"Getting raw data for: {query}")
        
        # Make search request
        search_results = search_businesses(query)
        
        # Return the raw data
        return search_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting raw Serper data: {str(e)}") from e

@router.post("/search-businesses", response_model=BusinessSearchResponse)
def search_local_businesses(request: BusinessFilterRequest) -> BusinessSearchResponse:
    """Search for local businesses based on location and optional category. Supports up to 100 results maximum."""
    try:
        # Build search query in "Category in location" format
        query = f"Businesses in {request.location}"
        if request.category:
            query = f"{request.category} in {request.location}"
        
        # Log the query for debugging
        print(f"Searching for: {query}")
        
        # Make search request
        search_results = search_businesses(query)
        
        # Extract business data with filters
        businesses = extract_business_data(
            search_results, 
            request.max_results,
            filter_no_website=request.filter_no_website,
            max_rating=request.max_rating
        )
        
        # Count total results
        total_count = len(businesses)
        
        # Return response
        return BusinessSearchResponse(
            businesses=businesses,
            total_count=total_count,
            timestamp=time.time()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching businesses: {str(e)}") from e
