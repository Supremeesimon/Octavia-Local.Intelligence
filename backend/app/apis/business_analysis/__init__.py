from typing import List, Dict, Any, Optional, Tuple
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import time
import statistics
from app.apis.serper import BusinessData, BusinessSearchResponse, search_local_businesses, BusinessFilterRequest

# Create router
router = APIRouter()

# Models
class BusinessOpportunity(BaseModel):
    business_data: BusinessData
    opportunity_score: float = Field(..., description="Score from 0-100 indicating opportunity level")
    reasons: List[str] = Field(..., description="List of reasons why this is a good opportunity")
    improvement_areas: List[str] = Field(..., description="List of potential improvement areas")

class BusinessAnalysisRequest(BaseModel):
    location: str = Field(..., description="Location to search for businesses")
    category: Optional[str] = Field(None, description="Optional category to filter businesses")
    max_results: Optional[int] = Field(20, description="Maximum number of results to return")
    min_reviews: Optional[int] = Field(0, description="Minimum number of reviews required")
    exclude_chains: Optional[bool] = Field(False, description="Whether to try to exclude chain businesses")
    opportunity_threshold: Optional[float] = Field(50.0, description="Minimum opportunity score to include", ge=0, le=100)

class CategoryStats(BaseModel):
    category: str
    count: int
    avg_rating: Optional[float] = None
    website_percentage: float
    opportunity_score: float

class BusinessAnalysisResponse(BaseModel):
    opportunities: List[BusinessOpportunity]
    total_opportunities: int
    location_stats: Dict[str, Any]
    category_stats: Optional[List[CategoryStats]] = None
    timestamp: float

# Helper functions
def calculate_opportunity_score(business: BusinessData) -> Tuple[float, List[str], List[str]]:
    """
    Calculate an opportunity score for a business (0-100).
    100 = perfect opportunity, 0 = no opportunity
    Also returns lists of reasons and improvement areas
    """
    score = 0
    reasons = []
    improvements = []
    
    # No website is a huge opportunity
    if not business.has_website:
        score += 40
        reasons.append("No website detected")
        improvements.append("Create a professional business website")
    
    # Rating opportunities
    if business.rating is not None:
        if business.rating < 2.5:
            score += 30
            reasons.append(f"Very low rating ({business.rating}/5)")
            improvements.append("Online presence could help address reputation issues")
        elif business.rating < 3.5:
            score += 20
            reasons.append(f"Below average rating ({business.rating}/5)")
            improvements.append("Web presence to highlight positive aspects of business")
    else:
        # No rating could be an opportunity (new or unrated)
        score += 15
        reasons.append("No Google rating available")
        improvements.append("Web presence to establish online reputation")
    
    # Reviews count opportunities
    if business.reviews_count is not None:
        if business.reviews_count < 5:
            score += 15
            reasons.append(f"Very few reviews ({business.reviews_count})")
            improvements.append("Web presence to encourage more customer reviews")
        elif business.reviews_count < 20:
            score += 10
            reasons.append(f"Limited number of reviews ({business.reviews_count})")
            improvements.append("Website with review integration")
    else:
        # No reviews is an opportunity
        score += 15
        reasons.append("No reviews available")
        improvements.append("Website with testimonial section")
    
    # Cap score at 100
    score = min(score, 100)
    
    return score, reasons, improvements

def filter_chain_businesses(businesses: List[BusinessData]) -> List[BusinessData]:
    """
    Attempt to filter out businesses that are likely chains
    based on naming patterns and other heuristics
    """
    # Common chain words
    chain_indicators = [
        "mcdonalds", "walmart", "starbucks", "subway", "7-eleven",
        "tim hortons", "canadian tire", "home depot", "best buy", "costco",
        "safeway", "save-on-foods", "shoppers drug mart", "pizza hut", "wendys",
        "burger king", "boston pizza", "red lobster", "kfc", "a&w",
        "dairy queen", "dollarama", "shell", "petro-canada", "esso",
        "the brick", "staples", "mcdonalds", "subway", "dominos",
        "papa johns", "wendys", "taco bell", "harveys"
    ]
    
    filtered_businesses = []
    
    for business in businesses:
        # Check if business name contains chain indicators
        is_chain = False
        name_lower = business.name.lower()
        
        for indicator in chain_indicators:
            if indicator in name_lower:
                is_chain = True
                break
        
        if not is_chain:
            filtered_businesses.append(business)
    
    return filtered_businesses

def analyze_location_stats(businesses: List[BusinessData]) -> Dict[str, Any]:
    """
    Analyze location-based statistics for the given businesses
    """
    stats = {
        "total_businesses": len(businesses),
        "businesses_with_website": 0,
        "businesses_without_website": 0,
        "avg_rating": None,
        "rating_distribution": {
            "0-1": 0,
            "1-2": 0,
            "2-3": 0,
            "3-4": 0,
            "4-5": 0,
            "no_rating": 0
        }
    }
    
    ratings = []
    
    for business in businesses:
        # Website stats
        if business.has_website:
            stats["businesses_with_website"] += 1
        else:
            stats["businesses_without_website"] += 1
        
        # Rating stats
        if business.rating is not None:
            ratings.append(business.rating)
            
            # Rating distribution
            if business.rating < 1:
                stats["rating_distribution"]["0-1"] += 1
            elif business.rating < 2:
                stats["rating_distribution"]["1-2"] += 1
            elif business.rating < 3:
                stats["rating_distribution"]["2-3"] += 1
            elif business.rating < 4:
                stats["rating_distribution"]["3-4"] += 1
            else:
                stats["rating_distribution"]["4-5"] += 1
        else:
            stats["rating_distribution"]["no_rating"] += 1
    
    # Calculate average rating if we have any
    if ratings:
        stats["avg_rating"] = statistics.mean(ratings)
    
    # Website percentage
    if businesses:
        stats["website_percentage"] = (stats["businesses_with_website"] / stats["total_businesses"]) * 100
    else:
        stats["website_percentage"] = 0
    
    return stats

def analyze_category_stats(businesses: List[BusinessData]) -> List[CategoryStats]:
    """
    Group businesses by category and analyze stats for each category
    """
    # Group businesses by category
    categories = {}
    for business in businesses:
        category = business.category or "Uncategorized"
        if category not in categories:
            categories[category] = []
        categories[category].append(business)
    
    # Calculate stats for each category
    category_stats = []
    for category, category_businesses in categories.items():
        # Skip categories with too few businesses
        if len(category_businesses) < 2:
            continue
        
        # Count businesses with websites
        with_website = sum(1 for b in category_businesses if b.has_website)
        website_percentage = (with_website / len(category_businesses)) * 100
        
        # Calculate average rating
        ratings = [b.rating for b in category_businesses if b.rating is not None]
        avg_rating = statistics.mean(ratings) if ratings else None
        
        # Calculate opportunity score for category
        # Low ratings and low website percentage = more opportunity
        opp_score = 0
        if avg_rating is not None:
            rating_factor = max(0, 5 - avg_rating) / 5  # 0 to 1 scale
            opp_score += rating_factor * 50
        
        # Website percentage factor (lower = better opportunity)
        website_factor = (100 - website_percentage) / 100  # 0 to 1 scale
        opp_score += website_factor * 50
        
        category_stats.append(CategoryStats(
            category=category,
            count=len(category_businesses),
            avg_rating=avg_rating,
            website_percentage=website_percentage,
            opportunity_score=opp_score
        ))
    
    # Sort by opportunity score (highest first)
    category_stats.sort(key=lambda x: x.opportunity_score, reverse=True)
    
    return category_stats

# Endpoints
@router.post("/analyze", response_model=BusinessAnalysisResponse)
async def analyze_business_opportunities(request: BusinessAnalysisRequest) -> BusinessAnalysisResponse:
    """
    Analyze business opportunities based on location and category.
    Identifies and scores businesses that would benefit from web development services.
    """
    try:
        # Get business data from Serper API
        serper_request = BusinessFilterRequest(
            location=request.location,
            category=request.category,
            max_results=request.max_results,
            filter_no_website=False,  # We'll do our own filtering
            max_rating=None  # We'll do our own filtering
        )
        
        # Call the Serper API endpoint directly
        search_response = search_local_businesses(serper_request)
        businesses = search_response.businesses
        
        # Apply minimum reviews filter if specified
        if request.min_reviews > 0:
            businesses = [b for b in businesses if b.reviews_count is not None and b.reviews_count >= request.min_reviews]
        
        # Filter chain businesses if requested
        if request.exclude_chains:
            businesses = filter_chain_businesses(businesses)
        
        # Calculate opportunity scores for each business
        opportunities = []
        for business in businesses:
            score, reasons, improvements = calculate_opportunity_score(business)
            
            # Only include if it meets the opportunity threshold
            if score >= request.opportunity_threshold:
                opportunity = BusinessOpportunity(
                    business_data=business,
                    opportunity_score=score,
                    reasons=reasons,
                    improvement_areas=improvements
                )
                opportunities.append(opportunity)
        
        # Sort opportunities by score (highest first)
        opportunities.sort(key=lambda x: x.opportunity_score, reverse=True)
        
        # Analyze location stats
        location_stats = analyze_location_stats(businesses)
        
        # Generate category stats
        category_stats = analyze_category_stats(businesses) if len(businesses) >= 5 else None
        
        # Return the response
        return BusinessAnalysisResponse(
            opportunities=opportunities,
            total_opportunities=len(opportunities),
            location_stats=location_stats,
            category_stats=category_stats,
            timestamp=time.time()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing business opportunities: {str(e)}") from e
