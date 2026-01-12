"""Serper Google Search tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_serper_tools() -> list:
    """Get Serper API tools if API key is configured.
    
    Serper provides fast Google Search results via API.
    
    Returns:
        List of tools if Serper is configured, empty list otherwise.
        
    Available tools:
        - serper_google_search: Perform Google searches
    """
    config = load_config_file()
    serper_api_key = config.get("serper_api_key") if config else None
    
    if not serper_api_key:
        serper_api_key = os.environ.get("SERPER_API_KEY")
    
    if not serper_api_key:
        logger.info("[SERPER] No Serper API key configured, Google search disabled")
        return []
    
    try:
        import requests
        
        def serper_google_search(
            query: str,
            num_results: int = 10,
            country: str = "us",
            language: str = "en",
        ) -> dict:
            """Perform a Google search using Serper API.
            
            Returns structured search results from Google.
            
            Args:
                query: Search query string
                num_results: Number of results to return (default 10, max 100)
                country: Country code for localized results (default 'us')
                language: Language code (default 'en')
            
            Returns:
                Dictionary with organic results, knowledge graph, and more
            """
            try:
                num_results = min(num_results, 100)
                
                headers = {
                    "X-API-KEY": serper_api_key,
                    "Content-Type": "application/json",
                }
                payload = {
                    "q": query,
                    "num": num_results,
                    "gl": country,
                    "hl": language,
                }
                
                response = requests.post(
                    "https://google.serper.dev/search",
                    headers=headers,
                    json=payload,
                    timeout=30,
                )
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "query": query,
                        "error": f"API error: {response.status_code} - {response.text[:200]}",
                    }
                
                data = response.json()
                
                # Extract organic results
                organic = []
                for result in data.get("organic", []):
                    organic.append({
                        "title": result.get("title", ""),
                        "link": result.get("link", ""),
                        "snippet": result.get("snippet", ""),
                        "position": result.get("position", 0),
                    })
                
                # Extract knowledge graph if present
                knowledge_graph = data.get("knowledgeGraph", {})
                
                # Extract related searches
                related = [r.get("query", "") for r in data.get("relatedSearches", [])]
                
                return {
                    "success": True,
                    "query": query,
                    "organic_results": organic,
                    "knowledge_graph": {
                        "title": knowledge_graph.get("title", ""),
                        "type": knowledge_graph.get("type", ""),
                        "description": knowledge_graph.get("description", ""),
                    } if knowledge_graph else None,
                    "related_searches": related[:5],
                    "search_metadata": {
                        "country": country,
                        "language": language,
                    },
                }
            except Exception as e:
                return {
                    "success": False,
                    "query": query,
                    "error": str(e),
                }
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("serper_google_search", True):
            tools.append(serper_google_search)
            tool_names.append("serper_google_search")
        
        if tools:
            logger.info(f"[SERPER] Tools enabled: {', '.join(tool_names)}")
        else:
            logger.info("[SERPER] All Serper tools disabled by config")
        
        return tools
        
    except Exception as e:
        logger.error(f"[SERPER] Error initializing tools: {e}")
        return []

