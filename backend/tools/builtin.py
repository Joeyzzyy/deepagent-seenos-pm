"""Built-in tools that don't require any API key."""

import logging

from .config import get_enabled_tools

logger = logging.getLogger(__name__)


def get_builtin_tools() -> list:
    """Get built-in tools that don't require any API key.
    
    Returns:
        List of built-in tools (filtered by enabled_tools config).
        
    Available tools:
        - fetch_url: Fetch URL content and convert to markdown
    """
    enabled = get_enabled_tools()
    tools = []
    
    # Only add fetch_url if enabled
    if not enabled.get("fetch_url", True):
        logger.info("[BUILTIN] fetch_url disabled by config")
        return tools
    
    try:
        import requests
        from markdownify import markdownify
        
        def fetch_url(url: str, timeout: int = 30) -> dict:
            """Fetch content from a URL and convert HTML to markdown.
            
            Use this to read web page content. The HTML is automatically
            converted to clean markdown for easy processing.
            
            Args:
                url: The URL to fetch (must be HTTP/HTTPS)
                timeout: Request timeout in seconds (default 30)
            
            Returns:
                Dictionary containing the page content as markdown
            """
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (compatible; DeepAgents/1.0)"
                }
                response = requests.get(url, headers=headers, timeout=timeout)
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "")
                if "text/html" in content_type:
                    markdown_content = markdownify(response.text, heading_style="ATX")
                else:
                    markdown_content = response.text
                
                return {
                    "success": True,
                    "url": str(response.url),
                    "content": markdown_content[:50000],  # Limit content length
                    "content_type": content_type,
                    "content_length": len(markdown_content),
                }
            except Exception as e:
                return {
                    "success": False,
                    "url": url,
                    "error": str(e),
                }
        
        tools.append(fetch_url)
        logger.info("[BUILTIN] Built-in tools enabled (fetch_url)")
        return tools
        
    except ImportError as e:
        logger.warning(f"[BUILTIN] Required packages not installed: {e}")
        return []
    except Exception as e:
        logger.error(f"[BUILTIN] Error initializing tools: {e}")
        return []

