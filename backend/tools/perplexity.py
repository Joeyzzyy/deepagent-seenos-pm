"""Perplexity Sonar search tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_perplexity_tools() -> list:
    """Get Perplexity API tools if API key is configured.
    
    Perplexity provides two main endpoints:
    - /search: Returns raw search results (URLs, metadata)
    - /chat/completions: AI-generated answers with citations (via model parameter)
    
    Returns:
        List of tools if Perplexity is configured, empty list otherwise.
        
    Available tools:
        - perplexity_search: Raw search results via /search endpoint
        - perplexity_chat: AI answers via /chat/completions endpoint
    """
    config = load_config_file()
    perplexity_api_key = config.get("perplexity_api_key") if config else None
    
    if not perplexity_api_key:
        perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY")
    
    if not perplexity_api_key:
        logger.info("[PERPLEXITY] No Perplexity API key configured")
        return []
    
    try:
        import requests
        
        BASE_URL = "https://api.perplexity.ai"
        headers = {
            "Authorization": f"Bearer {perplexity_api_key}",
            "Content-Type": "application/json"
        }
        
        def perplexity_search(
            query: str,
            num_results: int = 10
        ) -> dict:
            """Search the web using Perplexity's /search endpoint.
            
            Returns raw search results with URLs and metadata, without AI summarization.
            Use this when you need source URLs for further processing.
            
            Args:
                query: Search query string
                num_results: Number of results to return (default 10)
            
            Returns:
                Dictionary containing search results with URLs and metadata
            """
            try:
                response = requests.post(
                    f"{BASE_URL}/search",
                    headers=headers,
                    json={
                        "query": query,
                        "num_results": num_results
                    },
                    timeout=60
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                return {"error": str(e)}
        
        def perplexity_chat(
            query: str,
            model: str = "sonar",
            search_mode: str = "web",
            recency_filter: str = None,
            domains: list[str] | None = None,
            return_images: bool = False,
            return_related_questions: bool = False
        ) -> dict:
            """Get AI-generated answers using Perplexity's /chat/completions endpoint.
            
            Returns synthesized answers with citations based on web search.
            
            Args:
                query: The question or search query
                model: Model to use. Options:
                    - "sonar": Lightweight search (default)
                    - "sonar-pro": Advanced search
                    - "sonar-deep-research": Exhaustive research
                    - "sonar-reasoning": Fast reasoning
                    - "sonar-reasoning-pro": Premier reasoning
                search_mode: Search mode - "web" (default), "academic", or "sec"
                recency_filter: Time filter - "day", "week", "month", or "year"
                domains: Domain filter list (max 20, prefix with - to exclude)
                return_images: Include images in response
                return_related_questions: Include related questions
            
            Returns:
                Dictionary containing AI answer with citations
            """
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": query}],
                    "search_mode": search_mode,
                    "temperature": 0.2,
                    "return_images": return_images,
                    "return_related_questions": return_related_questions
                }
                
                if recency_filter and recency_filter in ["day", "week", "month", "year"]:
                    payload["search_recency_filter"] = recency_filter
                
                if domains and len(domains) > 0:
                    payload["search_domain_filter"] = domains[:20]
                
                response = requests.post(
                    f"{BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120
                )
                response.raise_for_status()
                result = response.json()
                
                # Extract answer
                answer = ""
                if "choices" in result and len(result["choices"]) > 0:
                    answer = result["choices"][0].get("message", {}).get("content", "")
                
                return {
                    "success": True,
                    "query": query,
                    "answer": answer,
                    "model": model,
                    "search_results": result.get("search_results", []),
                    "usage": result.get("usage", {}),
                    "raw_response": result
                }
            except requests.exceptions.RequestException as e:
                return {
                    "success": False,
                    "query": query,
                    "error": str(e),
                    "answer": ""
                }
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("perplexity_search", True):
            tools.append(perplexity_search)
            tool_names.append("perplexity_search")
        if enabled.get("perplexity_chat", True):
            tools.append(perplexity_chat)
            tool_names.append("perplexity_chat")
        
        if tools:
            logger.info(f"[PERPLEXITY] Tools enabled: {', '.join(tool_names)}")
        else:
            logger.info("[PERPLEXITY] All Perplexity tools disabled by config")
        
        return tools
        
    except Exception as e:
        logger.error(f"[PERPLEXITY] Error initializing tools: {e}")
        return []

