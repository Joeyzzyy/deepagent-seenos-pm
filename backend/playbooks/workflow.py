"""StateGraph workflow for Competitor Growth Engine Audit Playbook."""

import logging
from langgraph.graph import StateGraph, END
from typing import Any

from .state import PlaybookState, create_initial_state
from .phases import (
    execute_phase_1,
    execute_phase_2,
    execute_phase_3,
    execute_phase_4,
    execute_phase_5,
    execute_phase_6,
    execute_phase_7,
)

logger = logging.getLogger(__name__)


def should_execute_phase_6(state: PlaybookState) -> str:
    """Decide whether to execute Phase 6 (Root Cause Investigation).
    
    Phase 6 is MANDATORY if traffic fluctuations were detected in Phase 2.
    
    Args:
        state: Current playbook state
    
    Returns:
        "phase_6" if investigation required, otherwise "phase_7"
    """
    phase2_data = state.get('phase2_history', {})
    
    if phase2_data.get('requires_investigation', False):
        logger.info("[ROUTER] Phase 2 detected fluctuations → Executing Phase 6")
        return "phase_6"
    else:
        logger.info("[ROUTER] No fluctuations detected → Skipping Phase 6")
        return "phase_7"


def build_playbook_workflow(agent: Any) -> StateGraph:
    """Build the StateGraph workflow for the playbook.
    
    Args:
        agent: LangGraph agent instance
    
    Returns:
        Compiled StateGraph
    """
    
    # Create StateGraph
    workflow = StateGraph(PlaybookState)
    
    # ============================================
    # Define Phase Nodes (with agent binding)
    # ============================================
    
    def phase_1_node(state: PlaybookState) -> PlaybookState:
        """Phase 1 wrapper to inject agent."""
        return execute_phase_1(state, agent)
    
    def phase_2_node(state: PlaybookState) -> PlaybookState:
        """Phase 2 wrapper to inject agent."""
        return execute_phase_2(state, agent)
    
    def phase_3_node(state: PlaybookState) -> PlaybookState:
        """Phase 3 wrapper to inject agent."""
        return execute_phase_3(state, agent)
    
    def phase_4_node(state: PlaybookState) -> PlaybookState:
        """Phase 4 wrapper to inject agent."""
        return execute_phase_4(state, agent)
    
    def phase_5_node(state: PlaybookState) -> PlaybookState:
        """Phase 5 wrapper to inject agent."""
        return execute_phase_5(state, agent)
    
    def phase_6_node(state: PlaybookState) -> PlaybookState:
        """Phase 6 wrapper to inject agent."""
        return execute_phase_6(state, agent)
    
    def phase_7_node(state: PlaybookState) -> PlaybookState:
        """Phase 7 wrapper to inject agent."""
        return execute_phase_7(state, agent)
    
    # ============================================
    # Add Nodes to Workflow
    # ============================================
    
    workflow.add_node("phase_1", phase_1_node)
    workflow.add_node("phase_2", phase_2_node)
    workflow.add_node("phase_3", phase_3_node)
    workflow.add_node("phase_4", phase_4_node)
    workflow.add_node("phase_5", phase_5_node)
    workflow.add_node("phase_6", phase_6_node)
    workflow.add_node("phase_7", phase_7_node)
    
    # ============================================
    # Define Workflow Edges
    # ============================================
    
    # Linear flow: 1 → 2 → 3 → 4 → 5
    workflow.set_entry_point("phase_1")
    workflow.add_edge("phase_1", "phase_2")
    workflow.add_edge("phase_2", "phase_3")
    workflow.add_edge("phase_3", "phase_4")
    workflow.add_edge("phase_4", "phase_5")
    
    # Conditional: 5 → 6 (if fluctuations) or 5 → 7 (if no fluctuations)
    workflow.add_conditional_edges(
        "phase_5",
        should_execute_phase_6,
        {
            "phase_6": "phase_6",
            "phase_7": "phase_7",
        }
    )
    
    # 6 → 7 (after investigation)
    workflow.add_edge("phase_6", "phase_7")
    
    # 7 → END
    workflow.add_edge("phase_7", END)
    
    logger.info("[WORKFLOW] StateGraph configured with 7 phases")
    
    # Compile workflow
    return workflow.compile()


def execute_playbook(
    agent: Any,
    playbook_id: str,
    competitor_domains: list[str],
    my_domain: str | None,
    primary_market: str
) -> PlaybookState:
    """Execute the full playbook workflow.
    
    Args:
        agent: LangGraph agent instance
        playbook_id: ID of the playbook to execute
        competitor_domains: List of competitor domains
        my_domain: User's domain (optional)
        primary_market: Target market (e.g., 'us')
    
    Returns:
        Final playbook state with all results
    """
    logger.info(f"[PLAYBOOK] Starting execution: {playbook_id}")
    logger.info(f"[PLAYBOOK] Competitors: {competitor_domains}")
    logger.info(f"[PLAYBOOK] My Domain: {my_domain}")
    logger.info(f"[PLAYBOOK] Market: {primary_market}")
    
    # Create initial state
    initial_state = create_initial_state(
        playbook_id=playbook_id,
        competitor_domains=competitor_domains,
        my_domain=my_domain,
        primary_market=primary_market
    )
    
    # Build workflow
    workflow = build_playbook_workflow(agent)
    
    # Execute workflow
    try:
        final_state = workflow.invoke(initial_state)
        
        logger.info(f"[PLAYBOOK] ✅ Execution complete")
        logger.info(f"[PLAYBOOK] Phases completed: {final_state['phases_completed']}")
        
        if final_state['errors']:
            logger.warning(f"[PLAYBOOK] ⚠️ Errors encountered: {final_state['errors']}")
        
        return final_state
        
    except Exception as e:
        logger.error(f"[PLAYBOOK] ❌ Execution failed: {e}")
        raise

