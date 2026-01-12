"""Playbook registry for metadata management."""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class PlaybookMetadata:
    """Playbook metadata."""
    id: str
    title: str
    description: str
    category: str
    complexity: str
    tags: List[str]
    version: str = "1.0"


# Global registry
_playbooks: Dict[str, PlaybookMetadata] = {}


def register_playbook(metadata: PlaybookMetadata):
    """Register a playbook with its metadata.
    
    Args:
        metadata: Playbook metadata
    """
    _playbooks[metadata.id] = metadata


def get_all_playbooks() -> List[PlaybookMetadata]:
    """Get all registered playbooks.
    
    Returns:
        List of playbook metadata
    """
    return list(_playbooks.values())


def get_playbook_metadata(playbook_id: str) -> Optional[PlaybookMetadata]:
    """Get metadata for a specific playbook.
    
    Args:
        playbook_id: Unique identifier for the playbook
        
    Returns:
        Playbook metadata or None if not found
    """
    return _playbooks.get(playbook_id)


# Register built-in playbooks
register_playbook(PlaybookMetadata(
    id="competitor-growth-engine-audit",
    title="Competitor SEO Growth Engine Audit",
    description="TOP-TIER Professional SEO competitive intelligence report with 20+ data sources per fluctuation",
    category="research",
    complexity="hard",
    tags=["seo", "competitor", "growth-engine", "traffic-analysis", "semrush"],
    version="1.0"
))

