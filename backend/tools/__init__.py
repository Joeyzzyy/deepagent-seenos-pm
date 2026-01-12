"""SEO and search tools for deep agent.

This module provides various tools for web search, SEO analysis, and content extraction.
"""

from .builtin import get_builtin_tools
from .serp import get_serp_tools
from .exa import get_exa_tools
from .tavily import get_tavily_tools
from .perplexity import get_perplexity_tools
from .semrush import get_semrush_tools
from .serper import get_serper_tools
from .reports import get_report_tools

__all__ = [
    "get_builtin_tools",
    "get_serp_tools",
    "get_exa_tools",
    "get_tavily_tools",
    "get_perplexity_tools",
    "get_semrush_tools",
    "get_serper_tools",
    "get_report_tools",
]


def get_all_tools() -> list:
    """Get all available tools combined.
    
    Returns:
        List of all tool functions from all providers.
    """
    return (
        get_builtin_tools() +
        get_serp_tools() +
        get_exa_tools() +
        get_tavily_tools() +
        get_perplexity_tools() +
        get_semrush_tools() +
        get_serper_tools() +
        get_report_tools()
    )

