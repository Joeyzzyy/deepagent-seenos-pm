"""Tavily web search and crawling tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_tavily_tools() -> list:
    """Get Tavily API tools if API key is configured.
    
    Returns:
        List of tools if Tavily is configured, empty list otherwise.
        
    Available tools (matching Tavily API endpoints):
        - tavily_search: /search - Search the web for information
        - tavily_extract: /extract - Extract content from URLs
        - tavily_map: /map - Discover website structure and internal links
        - tavily_crawl: /crawl - Crawl and extract content from entire website
    """
    config = load_config_file()
    tavily_api_key = config.get("tavily_api_key") if config else None
    
    if not tavily_api_key:
        tavily_api_key = os.environ.get("TAVILY_API_KEY")
    
    if not tavily_api_key:
        logger.info("[TAVILY] No Tavily API key configured, web search disabled")
        return []
    
    # Set environment variable for any libraries that need it
    os.environ["TAVILY_API_KEY"] = tavily_api_key
    
    try:
        from tavily import TavilyClient
        
        tavily_client = TavilyClient(api_key=tavily_api_key)
        
        def tavily_search(
            query: str,
            max_results: int = 5,
        ) -> dict:
            """Search the web using Tavily /search endpoint.
            
            Args:
                query: Search query string
                max_results: Maximum number of results to return (default 5)
            
            Returns:
                Dictionary containing search results with titles, URLs, and content snippets
            """
            try:
                response = tavily_client.search(
                    query=query,
                    max_results=max_results,
                    include_raw_content=False,
                )
                
                results = []
                for result in response.get("results", []):
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", ""),
                    })
                
                return {
                    "success": True,
                    "query": query,
                    "results": results,
                    "answer": response.get("answer", ""),
                }
            except Exception as e:
                return {
                    "success": False,
                    "query": query,
                    "error": str(e),
                    "results": [],
                }
        
        def tavily_extract(
            urls: list[str],
            include_images: bool = False,
        ) -> dict:
            """Extract content from URLs using Tavily /extract endpoint.
            
            Handles JavaScript-rendered pages and complex layouts.
            Can extract from single URL or multiple URLs (max 20).
            
            Args:
                urls: List of URLs to extract content from (max 20)
                include_images: Whether to include extracted images (default False)
            
            Returns:
                Dictionary containing extracted content from each URL
            """
            try:
                urls = urls[:20]
                
                response = tavily_client.extract(
                    urls=urls,
                    include_images=include_images,
                )
                
                results = []
                for result in response.get("results", []):
                    results.append({
                        "url": result.get("url", ""),
                        "content": result.get("raw_content", "")[:30000],
                        "images": result.get("images", []) if include_images else [],
                    })
                
                return {
                    "success": True,
                    "urls_requested": len(urls),
                    "urls_extracted": len(results),
                    "results": results,
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "results": [],
                }
        
        def tavily_map(
            url: str,
            max_depth: int = 2,
            limit: int = 50,
        ) -> dict:
            """Discover and map the structure of a website using Tavily /map endpoint.
            
            Use this to understand a website's structure before crawling.
            Returns all internal links found starting from the base URL.
            
            Args:
                url: The root URL to start mapping from
                max_depth: How many levels deep to explore (default 2)
                limit: Maximum number of URLs to return (default 50)
            
            Returns:
                Dictionary containing list of discovered URLs
            """
            try:
                response = tavily_client.map(
                    url=url,
                    max_depth=max_depth,
                    limit=limit,
                )
                
                discovered_urls = response.get("results", [])
                
                return {
                    "success": True,
                    "base_url": url,
                    "max_depth": max_depth,
                    "urls_found": len(discovered_urls),
                    "urls": discovered_urls,
                }
            except Exception as e:
                return {
                    "success": False,
                    "base_url": url,
                    "error": str(e),
                    "urls": [],
                }
        
        def tavily_crawl(
            url: str,
            max_depth: int = 2,
            limit: int = 20,
            instructions: str = "",
        ) -> dict:
            """Crawl a website and extract content using Tavily /crawl endpoint.
            
            Automatically follows internal links and extracts content.
            Use this for building knowledge bases or comprehensive research.
            
            Args:
                url: The starting URL to begin crawling
                max_depth: How many levels deep to crawl (default 2)
                limit: Maximum number of pages to crawl (default 20)
                instructions: Optional instructions to filter pages
            
            Returns:
                Dictionary containing crawled pages with their content
            """
            try:
                crawl_params = {
                    "url": url,
                    "max_depth": max_depth,
                    "limit": limit,
                }
                if instructions:
                    crawl_params["instructions"] = instructions
                
                response = tavily_client.crawl(**crawl_params)
                
                results = []
                for result in response.get("results", []):
                    results.append({
                        "url": result.get("url", ""),
                        "title": result.get("title", ""),
                        "content": result.get("raw_content", "")[:20000],
                    })
                
                return {
                    "success": True,
                    "start_url": url,
                    "pages_crawled": len(results),
                    "max_depth": max_depth,
                    "instructions": instructions or "None",
                    "results": results,
                }
            except Exception as e:
                return {
                    "success": False,
                    "start_url": url,
                    "error": str(e),
                    "results": [],
                }
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("tavily_search", True):
            tools.append(tavily_search)
            tool_names.append("tavily_search")
        if enabled.get("tavily_extract", True):
            tools.append(tavily_extract)
            tool_names.append("tavily_extract")
        if enabled.get("tavily_map", True):
            tools.append(tavily_map)
            tool_names.append("tavily_map")
        if enabled.get("tavily_crawl", True):
            tools.append(tavily_crawl)
            tool_names.append("tavily_crawl")
        
        if tools:
            logger.info(f"[TAVILY] Tools enabled: {', '.join(tool_names)}")
        else:
            logger.info("[TAVILY] All Tavily tools disabled by config")
        
        return tools
        
    except ImportError as e:
        logger.warning(f"[TAVILY] Required packages not installed: {e}")
        logger.warning("[TAVILY] Run: pip install tavily-python")
        return []
    except Exception as e:
        logger.error(f"[TAVILY] Error initializing tools: {e}")
        return []

