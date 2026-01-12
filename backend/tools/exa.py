"""Exa Neural Search tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_exa_tools() -> list:
    """Get Exa API tools if API key is configured.
    
    Returns:
        List of tools if Exa is configured, empty list otherwise.
        
    Available tools:
        - exa_search: Neural/keyword search for web pages
        - exa_contents: Get clean content from URLs
        - exa_find_similar: Find semantically similar pages
        - exa_answer: Get direct answers with citations
        - exa_research: Automate in-depth web research with citations
    """
    config = load_config_file()
    exa_api_key = config.get("exa_api_key") if config else None
    
    if not exa_api_key:
        exa_api_key = os.environ.get("EXA_API_KEY")
    
    if not exa_api_key:
        logger.info("[EXA] No Exa API key configured, neural search disabled")
        return []
    
    try:
        import requests
        
        BASE_URL = "https://api.exa.ai"
        headers = {
            "x-api-key": exa_api_key,
            "Content-Type": "application/json"
        }
        
        def _exa_request(endpoint: str, payload: dict) -> dict:
            """Helper function to make Exa API requests."""
            try:
                response = requests.post(
                    f"{BASE_URL}/{endpoint}",
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                return {"error": str(e)}
        
        def exa_search(
            query: str,
            num_results: int = 10,
            search_type: str = "auto",
            use_autoprompt: bool = True,
            include_text: bool = True,
            include_highlights: bool = True
        ) -> dict:
            """Search the web using Exa's neural/keyword search.
            
            Args:
                query: Search query string
                num_results: Number of results to return (default 10)
                search_type: "neural", "keyword", or "auto" (default "auto")
                use_autoprompt: Automatically optimize query (default True)
                include_text: Include page text content (default True)
                include_highlights: Include highlighted snippets (default True)
            
            Returns:
                Dictionary containing search results with titles, URLs, and content
            """
            payload = {
                "query": query,
                "numResults": num_results,
                "type": search_type,
                "useAutoprompt": use_autoprompt,
                "contents": {
                    "text": include_text,
                    "highlights": include_highlights
                }
            }
            return _exa_request("search", payload)
        
        def exa_contents(
            urls: list,
            include_text: bool = True,
            include_highlights: bool = False,
            highlight_query: str = None
        ) -> dict:
            """Get clean, parsed content from URLs.
            
            Args:
                urls: List of URLs to get content from
                include_text: Include main text content (default True)
                include_highlights: Include highlighted snippets (default False)
                highlight_query: Query for generating highlights (optional)
            
            Returns:
                Dictionary containing parsed content from each URL
            """
            payload = {
                "ids": urls,
                "text": include_text,
                "highlights": include_highlights
            }
            if highlight_query:
                payload["highlightQuery"] = highlight_query
            return _exa_request("contents", payload)
        
        def exa_find_similar(
            url: str,
            num_results: int = 10,
            include_text: bool = True,
            exclude_source_domain: bool = True
        ) -> dict:
            """Find web pages semantically similar to a given URL.
            
            Args:
                url: URL to find similar pages for
                num_results: Number of similar pages to return (default 10)
                include_text: Include page text content (default True)
                exclude_source_domain: Exclude pages from the same domain (default True)
            
            Returns:
                Dictionary containing similar pages with titles, URLs, and content
            """
            payload = {
                "url": url,
                "numResults": num_results,
                "excludeSourceDomain": exclude_source_domain,
                "contents": {
                    "text": include_text
                }
            }
            return _exa_request("findSimilar", payload)
        
        def exa_answer(
            query: str,
            text: bool = True
        ) -> dict:
            """Get direct answers to questions with citations.
            
            Args:
                query: Question to answer
                text: Include source text (default True)
            
            Returns:
                Dictionary containing answer with citations
            """
            payload = {
                "query": query,
                "text": text
            }
            return _exa_request("answer", payload)
        
        def exa_research(
            query: str,
            model: str = "exa-research"
        ) -> dict:
            """Automate in-depth web research and receive structured JSON results with citations.
            
            Args:
                query: Research topic or question
                model: Model to use - "exa-research" (standard) or "exa-research-pro" (advanced)
            
            Returns:
                Dictionary containing structured research results with citations
            """
            try:
                response = requests.post(
                    f"{BASE_URL}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [
                            {"role": "user", "content": query}
                        ]
                    },
                    timeout=120
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                return {"error": str(e)}
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("exa_search", True):
            tools.append(exa_search)
            tool_names.append("exa_search")
        if enabled.get("exa_contents", True):
            tools.append(exa_contents)
            tool_names.append("exa_contents")
        if enabled.get("exa_find_similar", True):
            tools.append(exa_find_similar)
            tool_names.append("exa_find_similar")
        if enabled.get("exa_answer", True):
            tools.append(exa_answer)
            tool_names.append("exa_answer")
        if enabled.get("exa_research", True):
            tools.append(exa_research)
            tool_names.append("exa_research")
        
        logger.info(f"[EXA] Loaded {len(tools)} Exa tools: {', '.join(tool_names)}")
        return tools
        
    except Exception as e:
        logger.error(f"[EXA] Failed to initialize Exa tools: {e}")
        return []

