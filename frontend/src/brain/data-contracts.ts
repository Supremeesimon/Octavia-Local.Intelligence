/** BusinessAnalysisRequest */
export interface BusinessAnalysisRequest {
  /**
   * Location
   * Location to search for businesses
   */
  location: string;
  /**
   * Category
   * Optional category to filter businesses
   */
  category?: string | null;
  /**
   * Max Results
   * Maximum number of results to return
   * @default 20
   */
  max_results?: number | null;
  /**
   * Min Reviews
   * Minimum number of reviews required
   * @default 0
   */
  min_reviews?: number | null;
  /**
   * Exclude Chains
   * Whether to try to exclude chain businesses
   * @default false
   */
  exclude_chains?: boolean | null;
  /**
   * Opportunity Threshold
   * Minimum opportunity score to include
   * @default 50
   */
  opportunity_threshold?: number | null;
}

/** BusinessAnalysisResponse */
export interface BusinessAnalysisResponse {
  /** Opportunities */
  opportunities: BusinessOpportunity[];
  /** Total Opportunities */
  total_opportunities: number;
  /** Location Stats */
  location_stats: Record<string, any>;
  /** Category Stats */
  category_stats?: CategoryStats[] | null;
  /** Timestamp */
  timestamp: number;
}

/** BusinessContact */
export interface BusinessContact {
  /** Phone */
  phone?: string | null;
  /** Address */
  address?: string | null;
  /** Website */
  website?: string | null;
}

/** BusinessData */
export interface BusinessData {
  /** Name */
  name: string;
  /** Rating */
  rating?: number | null;
  /** Reviews Count */
  reviews_count?: number | null;
  /**
   * Has Website
   * @default false
   */
  has_website?: boolean;
  /** Category */
  category?: string | null;
  contact: BusinessContact;
  /** Google Maps Url */
  google_maps_url?: string | null;
  /** Image Url */
  image_url?: string | null;
  /** Business Hours */
  business_hours?: string | null;
  /** Social Media */
  social_media?: string[] | null;
  /** Email */
  email?: string | null;
  /** Latitude */
  latitude?: number | null;
  /** Longitude */
  longitude?: number | null;
  /** Price Level */
  price_level?: string | null;
}

/** BusinessFilterRequest */
export interface BusinessFilterRequest {
  /**
   * Location
   * Location to search for businesses (e.g. 'Lethbridge, Alberta')
   */
  location: string;
  /**
   * Category
   * Optional category to filter businesses (e.g. 'restaurants', 'cafes')
   */
  category?: string | null;
  /**
   * Max Results
   * Maximum number of results to return
   * @default 100
   */
  max_results?: number | null;
  /**
   * Filter No Website
   * Filter to only include businesses with no website
   * @default false
   */
  filter_no_website?: boolean | null;
  /**
   * Max Rating
   * Filter to only include businesses with rating below this value
   */
  max_rating?: number | null;
}

/** BusinessOpportunity */
export interface BusinessOpportunity {
  business_data: BusinessData;
  /**
   * Opportunity Score
   * Score from 0-100 indicating opportunity level
   */
  opportunity_score: number;
  /**
   * Reasons
   * List of reasons why this is a good opportunity
   */
  reasons: string[];
  /**
   * Improvement Areas
   * List of potential improvement areas
   */
  improvement_areas: string[];
}

/** BusinessSearchResponse */
export interface BusinessSearchResponse {
  /** Businesses */
  businesses: BusinessData[];
  /** Total Count */
  total_count: number;
  /** Timestamp */
  timestamp: number;
}

/** CategoryStats */
export interface CategoryStats {
  /** Category */
  category: string;
  /** Count */
  count: number;
  /** Avg Rating */
  avg_rating?: number | null;
  /** Website Percentage */
  website_percentage: number;
  /** Opportunity Score */
  opportunity_score: number;
}

/** GeminiRequest */
export interface GeminiRequest {
  /**
   * Api Key
   * Gemini API key
   */
  api_key: string;
  /**
   * Prompt
   * The prompt to send to Gemini
   */
  prompt: string;
  /**
   * Model
   * The Gemini model to use
   * @default "gemini-pro"
   */
  model?: string;
  /**
   * Temperature
   * Temperature for generation
   * @min 0
   * @max 1
   * @default 0.7
   */
  temperature?: number;
  /**
   * Max Tokens
   * Maximum tokens to generate
   */
  max_tokens?: number | null;
}

/** GeminiResponse */
export interface GeminiResponse {
  /** Text */
  text: string;
  /** Model */
  model: string;
  /** Finish Reason */
  finish_reason?: string | null;
  /** Usage */
  usage?: Record<string, any> | null;
  /** Timestamp */
  timestamp: number;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** ValidateKeyRequest */
export interface ValidateKeyRequest {
  /**
   * Api Key
   * Gemini API key to validate
   */
  api_key: string;
}

/** ValidateKeyResponse */
export interface ValidateKeyResponse {
  /** Is Valid */
  is_valid: boolean;
  /** Message */
  message: string;
  /** Timestamp */
  timestamp: number;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type AnalyzeBusinessOpportunitiesData = BusinessAnalysisResponse;

export type AnalyzeBusinessOpportunitiesError = HTTPValidationError;

export type GetRawSerperDataData = any;

export type GetRawSerperDataError = HTTPValidationError;

export type SearchLocalBusinessesData = BusinessSearchResponse;

export type SearchLocalBusinessesError = HTTPValidationError;

export type GenerateGeminiResponseData = GeminiResponse;

export type GenerateGeminiResponseError = HTTPValidationError;

export type ValidateGeminiApiKeyData = ValidateKeyResponse;

export type ValidateGeminiApiKeyError = HTTPValidationError;
