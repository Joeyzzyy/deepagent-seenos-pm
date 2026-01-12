"""Playbook package for structured SEO analysis workflows."""

from .state import PlaybookState, create_initial_state
from .workflow import execute_playbook, build_playbook_workflow
from .loader import get_playbook  # Keep existing loader for backward compatibility

__all__ = [
    'PlaybookState',
    'create_initial_state',
    'execute_playbook',
    'build_playbook_workflow',
    'get_playbook',  # Legacy
]
