import {
  AnalyzeBusinessOpportunitiesData,
  AnalyzeBusinessOpportunitiesError,
  BusinessAnalysisRequest,
  BusinessFilterRequest,
  CheckHealthData,
  GeminiRequest,
  GenerateGeminiResponseData,
  GenerateGeminiResponseError,
  GetRawSerperDataData,
  GetRawSerperDataError,
  SearchLocalBusinessesData,
  SearchLocalBusinessesError,
  ValidateGeminiApiKeyData,
  ValidateGeminiApiKeyError,
  ValidateKeyRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Analyze business opportunities based on location and category. Identifies and scores businesses that would benefit from web development services.
   *
   * @tags dbtn/module:business_analysis
   * @name analyze_business_opportunities
   * @summary Analyze Business Opportunities
   * @request POST:/routes/analyze
   */
  analyze_business_opportunities = (data: BusinessAnalysisRequest, params: RequestParams = {}) =>
    this.request<AnalyzeBusinessOpportunitiesData, AnalyzeBusinessOpportunitiesError>({
      path: `/routes/analyze`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get raw data from Serper API for debugging purposes
   *
   * @tags dbtn/module:serper
   * @name get_raw_serper_data
   * @summary Get Raw Serper Data
   * @request POST:/routes/raw-serper-data
   */
  get_raw_serper_data = (data: BusinessFilterRequest, params: RequestParams = {}) =>
    this.request<GetRawSerperDataData, GetRawSerperDataError>({
      path: `/routes/raw-serper-data`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Search for local businesses based on location and optional category. Supports up to 100 results maximum.
   *
   * @tags dbtn/module:serper
   * @name search_local_businesses
   * @summary Search Local Businesses
   * @request POST:/routes/search-businesses
   */
  search_local_businesses = (data: BusinessFilterRequest, params: RequestParams = {}) =>
    this.request<SearchLocalBusinessesData, SearchLocalBusinessesError>({
      path: `/routes/search-businesses`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a response from Gemini API
   *
   * @tags dbtn/module:gemini
   * @name generate_gemini_response
   * @summary Generate Gemini Response
   * @request POST:/routes/generate
   */
  generate_gemini_response = (data: GeminiRequest, params: RequestParams = {}) =>
    this.request<GenerateGeminiResponseData, GenerateGeminiResponseError>({
      path: `/routes/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Validate a Gemini API key
   *
   * @tags dbtn/module:gemini
   * @name validate_gemini_api_key
   * @summary Validate Gemini Api Key
   * @request POST:/routes/validate-key
   */
  validate_gemini_api_key = (data: ValidateKeyRequest, params: RequestParams = {}) =>
    this.request<ValidateGeminiApiKeyData, ValidateGeminiApiKeyError>({
      path: `/routes/validate-key`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
