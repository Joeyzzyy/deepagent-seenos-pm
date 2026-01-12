"""Playbook loader and template manager."""

import os
import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class PlaybookLoader:
    """Load and manage playbook templates."""
    
    def __init__(self, playbooks_dir: Optional[Path] = None):
        """Initialize playbook loader.
        
        Args:
            playbooks_dir: Directory containing playbook templates.
                          Defaults to ./playbooks/templates/
        """
        if playbooks_dir is None:
            playbooks_dir = Path(__file__).parent / "templates"
        
        self.playbooks_dir = playbooks_dir
        self._cache: Dict[str, str] = {}
    
    def load_playbook(self, playbook_id: str) -> str:
        """Load playbook template from file.
        
        Args:
            playbook_id: Unique identifier for the playbook
            
        Returns:
            Playbook prompt template as string
            
        Raises:
            FileNotFoundError: If playbook template doesn't exist
        """
        # Check cache first
        if playbook_id in self._cache:
            logger.info(f"[PLAYBOOK] Loaded from cache: {playbook_id}")
            return self._cache[playbook_id]
        
        # Load from file
        template_path = self.playbooks_dir / f"{playbook_id}.txt"
        
        if not template_path.exists():
            raise FileNotFoundError(
                f"Playbook template not found: {playbook_id} "
                f"(expected path: {template_path})"
            )
        
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()
        
        # Cache for future use
        self._cache[playbook_id] = template
        logger.info(f"[PLAYBOOK] Loaded template: {playbook_id} ({len(template)} chars)")
        
        return template
    
    def render_playbook(self, playbook_id: str, params: Dict[str, any]) -> str:
        """Render playbook template with parameters.
        
        Args:
            playbook_id: Unique identifier for the playbook
            params: Dictionary of parameters to inject into template
            
        Returns:
            Rendered playbook prompt ready for execution
        """
        template = self.load_playbook(playbook_id)
        
        # Replace all {{variable}} placeholders
        rendered = template
        for key, value in params.items():
            placeholder = f"{{{{{key}}}}}"
            
            # Handle list values (e.g., competitor_domains)
            if isinstance(value, list):
                if len(value) > 0:
                    value_str = '\n'.join(f"{i+1}. {item}" for i, item in enumerate(value))
                else:
                    value_str = ''
            else:
                value_str = str(value) if value is not None else ''
            
            rendered = rendered.replace(placeholder, value_str)
        
        logger.info(
            f"[PLAYBOOK] Rendered {playbook_id} with {len(params)} params "
            f"({len(template)} → {len(rendered)} chars)"
        )
        
        return rendered


# Global loader instance
_loader = PlaybookLoader()


def get_playbook(playbook_id: str, params: Dict[str, any]) -> str:
    """Get rendered playbook prompt (convenience function).
    
    Args:
        playbook_id: Unique identifier for the playbook
        params: Dictionary of parameters to inject into template
        
    Returns:
        Rendered playbook prompt ready for execution
    """
    return _loader.render_playbook(playbook_id, params)

