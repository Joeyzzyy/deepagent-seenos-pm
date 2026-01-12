"""Playbook State definition for LangGraph execution."""

from typing import TypedDict, List, Dict, Optional, Any


class PlaybookState(TypedDict):
    """State for Competitor Growth Engine Audit Playbook.
    
    This state is passed through all 7 phases of execution.
    """
    
    # ============================================
    # Core Fields (synced to frontend)
    # ============================================
    messages: List[Any]  # Chat messages
    todos: List[Dict[str, Any]]  # Task tracking for UI display
    
    # ============================================
    # Input Parameters
    # ============================================
    playbook_id: str
    competitor_domains: List[str]
    my_domain: Optional[str]
    primary_market: str
    
    # ============================================
    # Execution Control
    # ============================================
    current_phase: int  # 1-7
    phases_completed: List[int]  # Track completed phases
    errors: List[str]  # Collect errors
    
    # ============================================
    # Phase 1: Batch Overview
    # ============================================
    phase1_overview: Dict[str, Any]
    # Expected structure:
    # {
    #   "success": bool,
    #   "domains_data": [
    #     {
    #       "domain": str,
    #       "rank": str,
    #       "organic_keywords": str,
    #       "organic_traffic": str,
    #       "organic_cost": str,
    #       "authority_score": str,  # (from phase 3)
    #     }
    #   ]
    # }
    
    # ============================================
    # Phase 2: Historical Trends + MoM Analysis
    # ============================================
    phase2_history: Dict[str, Any]
    # Expected structure:
    # {
    #   "domains": {
    #     "domain1": {
    #       "history": [...],  # 12 months data
    #       "mom_analysis": [...],  # Month-over-month calculations
    #       "fluctuations": [...],  # Detected >15% changes
    #       "volatility_score": float,
    #     }
    #   },
    #   "requires_investigation": bool,
    #   "investigation_domains": List[str],
    # }
    
    # ============================================
    # Phase 3: Content + Technical SEO
    # ============================================
    phase3_content: Dict[str, Any]
    # Expected structure:
    # {
    #   "domains": {
    #     "domain1": {
    #       "pages": [...],  # Top 50 pages
    #       "keywords": [...],  # Top 20 keywords
    #       "backlinks": {...},  # Backlink overview
    #       "pseo_detected": bool,
    #       "technical_seo": {...},
    #       "user_experience": {...},
    #     }
    #   }
    # }
    
    # ============================================
    # Phase 4: Keyword Gap Analysis
    # ============================================
    phase4_gaps: Dict[str, Any]
    # Expected structure:
    # {
    #   "has_my_domain": bool,
    #   "gaps": {
    #     "competitor1": [...],  # Gap keywords
    #     "competitor2": [...],
    #   }
    # }
    
    # ============================================
    # Phase 5: Track Benchmarking
    # ============================================
    phase5_benchmark: Dict[str, Any]
    # Expected structure:
    # {
    #   "benchmark_track": str,  # e.g., "AI Video Generation"
    #   "benchmark_domains": [...],
    #   "track_gap_multiplier": float,
    #   "interpretation": str,
    # }
    
    # ============================================
    # Phase 6: Root Cause Investigation
    # ============================================
    phase6_investigation: Dict[str, Any]
    # Expected structure:
    # {
    #   "executed": bool,
    #   "domains_investigated": List[str],
    #   "investigations": {
    #     "domain1": {
    #       "fluctuation1": {
    #         "month": str,
    #         "type": str,  # "spike" or "drop"
    #         "searches_completed": int,  # Should be 50
    #         "sources_found": int,  # Should be 20+
    #         "evidence_timeline": [...],
    #         "root_cause_primary": str,
    #         "root_cause_secondary": List[str],
    #         "confidence": float,  # 0-10
    #       }
    #     }
    #   }
    # }
    
    # ============================================
    # Phase 7: Report Generation
    # ============================================
    phase7_report: Dict[str, Any]
    # Expected structure:
    # {
    #   "markdown_content": str,
    #   "html_file": str,
    #   "docx_file": str,
    #   "sections_included": List[str],  # Should have 7 sections
    #   "quality_checks": {
    #     "executive_summary": bool,
    #     "traffic_trends": bool,
    #     "content_analysis": bool,
    #     "root_cause_investigation": bool,
    #     "recommendations": bool,
    #     "action_plan": bool,
    #     "appendix": bool,
    #   }
    # }
    
    # ============================================
    # Final Output
    # ============================================
    final_report_path: Optional[str]
    execution_summary: Dict[str, Any]
    # Summary of execution:
    # {
    #   "total_phases": 7,
    #   "phases_executed": int,
    #   "total_api_calls": int,
    #   "total_searches": int,
    #   "execution_time_seconds": float,
    #   "quality_score": float,  # 0-100
    # }


def create_initial_state(
    playbook_id: str,
    competitor_domains: List[str],
    my_domain: Optional[str],
    primary_market: str
) -> PlaybookState:
    """Create initial state for playbook execution.
    
    Args:
        playbook_id: ID of the playbook to execute
        competitor_domains: List of competitor domains to analyze
        my_domain: User's domain (optional, for gap analysis)
        primary_market: Target market (e.g., 'us', 'uk')
    
    Returns:
        Initialized PlaybookState
    """
    return PlaybookState(
        # Core fields
        messages=[],
        todos=[],
        
        # Input parameters
        playbook_id=playbook_id,
        competitor_domains=competitor_domains,
        my_domain=my_domain,
        primary_market=primary_market,
        
        # Execution control
        current_phase=1,
        phases_completed=[],
        errors=[],
        
        # Phase results (initialized as empty)
        phase1_overview={},
        phase2_history={},
        phase3_content={},
        phase4_gaps={},
        phase5_benchmark={},
        phase6_investigation={},
        phase7_report={},
        
        # Final output
        final_report_path=None,
        execution_summary={},
    )
