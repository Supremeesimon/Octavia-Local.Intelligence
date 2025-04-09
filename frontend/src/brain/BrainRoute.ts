import {
  AnalyzeBusinessOpportunitiesData,
  BusinessAnalysisRequest,
  BusinessFilterRequest,
  CheckHealthData,
  GeminiRequest,
  GenerateGeminiResponseData,
  GetRawSerperDataData,
  SearchLocalBusinessesData,
  ValidateGeminiApiKeyData,
  ValidateKeyRequest,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Analyze business opportunities based on location and category. Identifies and scores businesses that would benefit from web development services.
   * @tags dbtn/module:business_analysis
   * @name analyze_business_opportunities
   * @summary Analyze Business Opportunities
   * @request POST:/routes/analyze
   */
  export namespace analyze_business_opportunities {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BusinessAnalysisRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeBusinessOpportunitiesData;
  }

  /**
   * @description Get raw data from Serper API for debugging purposes
   * @tags dbtn/module:serper
   * @name get_raw_serper_data
   * @summary Get Raw Serper Data
   * @request POST:/routes/raw-serper-data
   */
  export namespace get_raw_serper_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BusinessFilterRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetRawSerperDataData;
  }

  /**
   * @description Search for local businesses based on location and optional category. Supports up to 100 results maximum.
   * @tags dbtn/module:serper
   * @name search_local_businesses
   * @summary Search Local Businesses
   * @request POST:/routes/search-businesses
   */
  export namespace search_local_businesses {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BusinessFilterRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SearchLocalBusinessesData;
  }

  /**
   * @description Generate a response from Gemini API
   * @tags dbtn/module:gemini
   * @name generate_gemini_response
   * @summary Generate Gemini Response
   * @request POST:/routes/generate
   */
  export namespace generate_gemini_response {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GeminiRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateGeminiResponseData;
  }

  /**
   * @description Validate a Gemini API key
   * @tags dbtn/module:gemini
   * @name validate_gemini_api_key
   * @summary Validate Gemini Api Key
   * @request POST:/routes/validate-key
   */
  export namespace validate_gemini_api_key {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateKeyRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateGeminiApiKeyData;
  }
}
