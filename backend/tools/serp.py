"""SerpAPI Google Search tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_serp_tools() -> list:
    """Get SerpAPI tools if API key is configured.
    
    Returns:
        List of tools if SerpAPI is configured, empty list otherwise.
        
    Available tools:
        - serp_search: Unified search via engine parameter (google, google_news, google_images, etc.)
    """
    config = load_config_file()
    serp_api_key = config.get("serp_api_key") if config else None
    
    if not serp_api_key:
        serp_api_key = os.environ.get("SERP_API_KEY") or os.environ.get("SERPAPI_API_KEY")
    
    if not serp_api_key:
        logger.info("[SERPAPI] No SerpAPI key configured, Google search disabled")
        return []
    
    try:
        import requests
        
        BASE_URL = "https://serpapi.com/search"
        
        def _serp_request(params: dict) -> dict:
            """Helper function to make SerpAPI requests."""
            try:
                params["api_key"] = serp_api_key
                response = requests.get(BASE_URL, params=params, timeout=60)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                return {"error": str(e)}
        
        def serp_search(
            query: str,
            engine: str = "google",
            num_results: int = 10,
            location: str = None,
            lang: str = "en"
        ) -> dict:
            """Search using SerpAPI with different engines.
            
            Args:
                query: Search query string
                engine: Search engine to use. Options:
                    - "google": Web search (default)
                    - "google_news": News articles
                    - "google_images": Image search
                    - "google_maps": Local businesses/places
                    - "google_scholar": Academic papers
                    - "google_shopping": Shopping results
                    - "youtube": YouTube videos
                    - "bing": Bing web search
                    - "baidu": Baidu search
                num_results: Number of results to return (default 10)
                location: Location for localized results (optional)
                lang: Language code (default "en")
            
            Returns:
                Dictionary containing search results
            """
            params = {
                "engine": engine,
                "q": query,
                "num": num_results,
                "hl": lang
            }
            if location:
                params["location"] = location
            return _serp_request(params)
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("serpapi_search", True):
            tools.append(serp_search)
            tool_names.append("serp_search")
        
        logger.info(f"[SERPAPI] Loaded {len(tools)} SerpAPI tools: {', '.join(tool_names)}")
        return tools
        
    except Exception as e:
        logger.error(f"[SERPAPI] Failed to initialize SerpAPI tools: {e}")
        return []

