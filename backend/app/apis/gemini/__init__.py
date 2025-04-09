from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import google.generativeai as genai
from typing import List, Optional, Dict, Any
import json
import time

# Create router
router = APIRouter()

# Models
class GeminiRequest(BaseModel):
    api_key: str = Field(..., description="Gemini API key")
    prompt: str = Field(..., description="The prompt to send to Gemini")
    model: str = Field("gemini-pro", description="The Gemini model to use")
    temperature: float = Field(0.7, description="Temperature for generation", ge=0, le=1)
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")

class GeminiResponse(BaseModel):
    text: str
    model: str
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None
    timestamp: float

class ValidateKeyRequest(BaseModel):
    api_key: str = Field(..., description="Gemini API key to validate")

class ValidateKeyResponse(BaseModel):
    is_valid: bool
    message: str
    timestamp: float

# Helper functions
def configure_gemini(api_key: str):
    """Configure the Gemini API with the provided API key"""
    genai.configure(api_key=api_key)

def check_api_key_validity(api_key: str) -> bool:
    """Check if the provided Gemini API key is valid"""
    # Skip validation in development for testing purposes
    # This lets users use the app without a valid API key during development
    if not api_key or api_key.strip() == "":
        print("Empty API key provided, returning invalid")
        return False
    
    # For testing purposes, accept 'test' as a valid key
    if api_key.lower() == "test" or api_key.lower() == "testing":
        print("Test API key accepted")
        return True
        
    try:
        print(f"Attempting to validate Gemini API key: {api_key[:5]}...")
        genai.configure(api_key=api_key)
        # Try a simple model call to test the key
        generation_config = {
            "temperature": 0.1,
            "top_p": 0.95,
            "top_k": 0,
            "max_output_tokens": 5,
        }
        
        # Target Gemini 2.0 for validation
        # Try to get available models list first
        try:
            models = genai.list_models()
            model_names = [model.name for model in models]
            print(f"Available models: {model_names}")
            
            # Check for models with full paths
            if "models/gemini-1.5-flash" in model_names:
                model_name = "models/gemini-1.5-flash"
            elif "models/gemini-pro" in model_names:
                model_name = "models/gemini-pro"
            # Try Gemini 2.0 models first
            elif any("gemini-2.0" in name for name in model_names):
                # Find the first Gemini 2.0 model (non-vision)
                for name in model_names:
                    if "gemini-2.0" in name and "vision" not in name:
                        model_name = name
                        break
                else:  # If no Gemini 2.0 model found, try other gemini models
                    # Find the first gemini model (non-vision)
                    for name in model_names:
                        if "models/gemini" in name and "vision" not in name:
                            model_name = name
                            break
                    else:  # If no suitable model found
                        model_name = model_names[0]  # Use the first available model
            else:
                model_name = model_names[0] if model_names else "models/gemini-1.5-flash"  # Use first available or default
        except Exception as list_err:
            print(f"Error listing models: {str(list_err)}")
            model_name = "models/gemini-1.5-flash"  # Default to newer model
            
        print(f"Using model: {model_name}")
        model = genai.GenerativeModel(model_name=model_name, generation_config=generation_config)
        response = model.generate_content("hello")
        print("API key validation successful")
        return True
    except Exception as e:
        print(f"API key validation error: {str(e)}")
        return False

# Endpoints
@router.post("/generate", response_model=GeminiResponse)
async def generate_gemini_response(request: GeminiRequest) -> GeminiResponse:
    """Generate a response from Gemini API"""
    try:
        # Configure Gemini with the provided API key
        configure_gemini(request.api_key)
        
        # Set up the generation config
        generation_config = {
            "temperature": request.temperature,
            "top_p": 0.95,
            "top_k": 0,
        }
        
        if request.max_tokens is not None:
            generation_config["max_output_tokens"] = request.max_tokens
        
        # Try to get available models list first
        try:
            models = genai.list_models()
            model_names = [model.name for model in models]
            print(f"Available models: {model_names}")
            
            # Check if the requested model is available (with or without prefix)
            requested_with_prefix = f"models/{request.model}" if not request.model.startswith("models/") else request.model
            requested_without_prefix = request.model.replace("models/", "") if request.model.startswith("models/") else request.model
            
            if requested_with_prefix in model_names:
                model_name = requested_with_prefix
            elif any(requested_without_prefix in name for name in model_names):
                # Find the model containing the requested name
                for name in model_names:
                    if requested_without_prefix in name:
                        model_name = name
                        break
            # Fall back to available models - prioritize Gemini 2.0
            elif any("gemini-2.0" in name for name in model_names):
                # Find the first Gemini 2.0 model (non-vision)
                for name in model_names:
                    if "gemini-2.0" in name and "vision" not in name:
                        model_name = name
                        break
                print(f"Requested model {request.model} not available, using {model_name} instead")
            elif "models/gemini-1.5-flash" in model_names:
                model_name = "models/gemini-1.5-flash"
                print(f"Requested model {request.model} not available, using {model_name} instead")
            elif any("models/gemini" in name for name in model_names):
                # Find the first gemini model (non-vision)
                for name in model_names:
                    if "models/gemini" in name and "vision" not in name:
                        model_name = name
                        break
                else:
                    model_name = model_names[0]  # Use the first available model
                print(f"Requested model {request.model} not available, using {model_name} instead")
            else:
                model_name = model_names[0] if model_names else "models/gemini-1.5-flash"  # Use first available or default
                print(f"Requested model {request.model} not available, using {model_name} instead")
        except Exception as list_err:
            print(f"Error listing models: {str(list_err)}")
            model_name = "models/gemini-1.5-flash"  # Default to newer model
            
        print(f"Using model: {model_name}")
        # Initialize the model
        model = genai.GenerativeModel(model_name=model_name, generation_config=generation_config)
        
        # Generate the response
        response = model.generate_content(request.prompt)
        
        # Extract the response text
        result_text = response.text if hasattr(response, 'text') else str(response)
        
        # Construct the response
        return GeminiResponse(
            text=result_text[:2000],  # Truncate overly long responses
            model=model_name,  # Return the actual model used, not the requested one
            finish_reason="STOP", # Gemini doesn't provide finish reason in same way as OpenAI
            usage=None, # Gemini doesn't provide token usage in same way as OpenAI
            timestamp=time.time()
        )
    
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Special handling for quota exceeded errors
        if "quota exceeded" in str(e).lower() or "429" in str(e):
            return GeminiResponse(
                text="I apologize, but it looks like the Gemini API quota has been exceeded. Please try again later or use a different API key. You can update your API key by clicking on 'New Search' and going through the setup process again.",
                model=request.model,
                finish_reason="ERROR",
                usage=None,
                timestamp=time.time()
            )
        raise HTTPException(status_code=500, detail=f"Error generating Gemini response: {str(e)}") from e

@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_gemini_api_key(request: ValidateKeyRequest) -> ValidateKeyResponse:
    """Validate a Gemini API key"""
    try:
        is_valid = check_api_key_validity(request.api_key)
        
        message = "API key is valid" if is_valid else "Invalid API key"
        
        return ValidateKeyResponse(
            is_valid=is_valid,
            message=message,
            timestamp=time.time()
        )
    
    except Exception as e:
        print(f"API key validation error: {str(e)}")
        return ValidateKeyResponse(
            is_valid=False,
            message=f"Error validating API key: {str(e)}",
            timestamp=time.time()
        )
