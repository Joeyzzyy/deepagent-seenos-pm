"""Shared configuration for tools."""

import json
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Config file path (parent directory of tools/)
CONFIG_FILE = Path(__file__).parent.parent / "model_config.json"


def load_config_file() -> dict | None:
    """Load model configuration from JSON file.
    
    Returns:
        Configuration dict if file exists and is valid, None otherwise.
    """
    if not CONFIG_FILE.exists():
        return None
    
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"[TOOLS CONFIG] Error reading config: {e}")
        return None


def get_enabled_tools() -> dict:
    """Get enabled tools configuration from model_config.json.
    
    Returns:
        Dictionary with tool names as keys and boolean enabled status.
        Default: all tools enabled.
    """
    default_config = {
        "fetch_url": True,
        # SerpAPI tools
        "serpapi_search": True,
        # Exa tools
        "exa_search": True,
        "exa_contents": True,
        "exa_find_similar": True,
        "exa_answer": True,
        "exa_research": True,
        # Tavily tools
        "tavily_search": True,
        "tavily_extract": True,
        "tavily_map": True,
        "tavily_crawl": True,
        # Perplexity tools
        "perplexity_search": True,
        "perplexity_chat": True,
        # Semrush tools
        "semrush_domain_overview": True,
        "semrush_organic_keywords": True,
        "semrush_backlinks_overview": True,
        "semrush_backlinks_list": True,
        "semrush_keyword_gap": True,
        "semrush_traffic_analytics": True,
        # Serper tools
        "serper_google_search": True,
    }
    
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                config = json.load(f)
                enabled_tools = config.get("enabled_tools", {})
                # Merge with defaults (missing keys default to True)
                for key in default_config:
                    if key not in enabled_tools:
                        enabled_tools[key] = default_config[key]
                return enabled_tools
    except Exception as e:
        logger.warning(f"[TOOLS] Error reading enabled_tools config: {e}")
    
    return default_config

