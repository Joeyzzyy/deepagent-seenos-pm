"""Phase template loader for structured playbook execution."""

import os
from pathlib import Path
from typing import Dict


def get_phase_template(playbook_id: str, phase_number: int) -> str:
    """Load a specific phase template.
    
    Args:
        playbook_id: ID of the playbook (e.g., 'competitor-growth-engine-audit')
        phase_number: Phase number (1-7)
    
    Returns:
        Phase template content
    """
    template_dir = Path(__file__).parent / "templates" / f"{playbook_id}-phases"
    template_file = template_dir / f"phase_{phase_number}.txt"
    
    if not template_file.exists():
        raise FileNotFoundError(f"Phase {phase_number} template not found: {template_file}")
    
    with open(template_file, 'r', encoding='utf-8') as f:
        return f.read()


def get_playbook_header(playbook_id: str) -> str:
    """Load playbook header (intro/context before Phase 1).
    
    Args:
        playbook_id: ID of the playbook
    
    Returns:
        Header content
    """
    template_dir = Path(__file__).parent / "templates" / f"{playbook_id}-phases"
    header_file = template_dir / "header.txt"
    
    if header_file.exists():
        with open(header_file, 'r', encoding='utf-8') as f:
            return f.read()
    return ""


def get_critical_rules(playbook_id: str) -> str:
    """Load critical execution rules.
    
    Args:
        playbook_id: ID of the playbook
    
    Returns:
        Rules content
    """
    template_dir = Path(__file__).parent / "templates" / f"{playbook_id}-phases"
    rules_file = template_dir / "rules.txt"
    
    if rules_file.exists():
        with open(rules_file, 'r', encoding='utf-8') as f:
            return f.read()
    return ""


def render_phase_prompt(
    playbook_id: str,
    phase_number: int,
    params: Dict,
    previous_phase_data: Dict = None
) -> str:
    """Render a phase prompt with variable substitution.
    
    Args:
        playbook_id: ID of the playbook
        phase_number: Phase number (1-7)
        params: Input parameters (competitor_domains, my_domain, etc.)
        previous_phase_data: Results from previous phases
    
    Returns:
        Rendered prompt ready for agent
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug: log what data we have
    if previous_phase_data:
        logger.info(f"[PHASE {phase_number} TEMPLATE] Available phase data: {list(previous_phase_data.keys())}")
        for key in ['phase1_overview', 'phase2_history', 'phase3_content', 'phase4_gaps', 'phase5_benchmark']:
            if previous_phase_data.get(key):
                logger.info(f"[PHASE {phase_number} TEMPLATE] {key} exists with {len(str(previous_phase_data[key]))} chars")
            else:
                logger.info(f"[PHASE {phase_number} TEMPLATE] {key} is missing or None")
    
    # Load template
    template = get_phase_template(playbook_id, phase_number)
    
    # Variable substitution
    rendered = template
    
    # Basic parameters
    if 'competitor_domains' in params:
        domains_list = "\n".join([f"- {d}" for d in params['competitor_domains']])
        rendered = rendered.replace('{{competitor_domains}}', domains_list)
    
    if 'my_domain' in params:
        rendered = rendered.replace('{{my_domain}}', params.get('my_domain', 'N/A'))
    
    if 'primary_market' in params:
        rendered = rendered.replace('{{primary_market}}', params['primary_market'])
    
    # Add context from previous phases if available
    if previous_phase_data and phase_number > 1:
        context = f"\n\n## **Context from Previous Phases:**\n\n"
        
        if phase_number >= 2 and previous_phase_data.get('phase1_overview'):
            phase1 = previous_phase_data.get('phase1_overview') or {}
            if phase1.get('raw_output'):
                context += f"### Phase 1 Results:\n```\n{phase1['raw_output'][:3000]}\n```\n\n"
        
        if phase_number >= 3 and previous_phase_data.get('phase2_history'):
            phase2 = previous_phase_data.get('phase2_history') or {}
            if phase2.get('raw_output'):
                context += f"### Phase 2 Results:\n```\n{phase2['raw_output'][:3000]}\n```\n\n"
        
        if phase_number >= 4 and previous_phase_data.get('phase3_content'):
            phase3 = previous_phase_data.get('phase3_content') or {}
            if phase3.get('raw_output'):
                context += f"### Phase 3 Results:\n```\n{phase3['raw_output'][:3000]}\n```\n\n"
        
        if phase_number >= 5 and previous_phase_data.get('phase4_gaps'):
            phase4 = previous_phase_data.get('phase4_gaps') or {}
            if phase4.get('raw_output'):
                context += f"### Phase 4 Results:\n```\n{phase4['raw_output'][:3000]}\n```\n\n"
        
        if phase_number >= 6 and previous_phase_data.get('phase5_benchmark'):
            phase5 = previous_phase_data.get('phase5_benchmark') or {}
            if phase5.get('raw_output'):
                context += f"### Phase 5 Results:\n```\n{phase5['raw_output'][:3000]}\n```\n\n"
        
        if phase_number == 7 and previous_phase_data.get('phase6_investigation'):
            phase6 = previous_phase_data.get('phase6_investigation') or {}
            if phase6.get('executed') and phase6.get('raw_output'):
                context += f"### Phase 6 Results:\n```\n{phase6['raw_output'][:3000]}\n```\n\n"
        
        rendered = context + "\n\n---\n\n" + rendered
    
    # Add phase header with ACTUAL PARAMETERS
    all_domains = []
    if params.get('my_domain'):
        all_domains.append(params['my_domain'])
    if params.get('competitor_domains'):
        all_domains.extend(params['competitor_domains'])
    
    domains_text = ", ".join(all_domains)
    
    header = f"""
🎯 **EXECUTING PHASE {phase_number} OF 7**

You are executing Phase {phase_number} of the Competitor SEO Growth Engine Audit.

**YOUR TASK PARAMETERS** (USE THESE EXACT VALUES):
- **Your Domain**: {params.get('my_domain') or 'N/A'}
- **Competitor Domains**: {', '.join(params.get('competitor_domains', [])) if params.get('competitor_domains') else 'N/A'}
- **All Domains to Analyze**: {domains_text}
- **Target Market/Database**: {params.get('primary_market', 'us')}

**CRITICAL RULES FOR THIS PHASE**:
1. Execute EVERY step in this phase using the domains listed above
2. Do NOT ask for domain list - it's already provided above
3. Do NOT skip ahead to the next phase
4. If data is missing, use Fallback searches (perplexity_search/serper_search)
5. Verify completion before finishing
6. **AUTOMATED EXECUTION MODE**: This is a fully automated pipeline. Do NOT ask the user any questions, do NOT request confirmation, do NOT offer choices like "Would you like to proceed?" - just execute and complete the phase.

---

"""
    
    rendered = header + rendered
    
    # Add footer
    footer = f"""

---

✅ **PHASE {phase_number} COMPLETION CHECKLIST**:

Before finishing, verify:
- [ ] All required API calls made
- [ ] All data collected (or Fallback used if API failed)
- [ ] All calculations performed
- [ ] All "CRITICAL" instructions followed
- [ ] Results structured correctly for next phase

If ANY item is not checked, GO BACK and complete it.

**AFTER COMPLETION**: Provide structured output for Phase {phase_number} results.

⚠️ **REMINDER**: This is an automated pipeline. End with your analysis output only. Do NOT ask questions like "Would you like to proceed?" or "Ready for Phase X?" - the system will automatically continue to the next phase.
"""
    
    rendered = rendered + footer
    
    return rendered

