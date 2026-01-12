"""Phase execution nodes for StateGraph workflow."""

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from .state import PlaybookState
from .phase_templates import render_phase_prompt

logger = logging.getLogger(__name__)


def filter_phase_messages(messages: list) -> list:
    """Filter out phase instruction HumanMessages, keep only AI and Tool messages.
    
    This prevents phase prompts from being saved as user messages in chat history.
    Only Assistant responses and Tool calls should be visible to the user.
    
    Args:
        messages: List of messages from agent result
        
    Returns:
        Filtered list containing only AI and Tool messages
    """
    filtered = []
    for msg in messages:
        # Keep AIMessage and ToolMessage
        if isinstance(msg, (AIMessage, ToolMessage)):
            filtered.append(msg)
        # Also handle dict format messages
        elif isinstance(msg, dict):
            msg_type = msg.get('type', '')
            if msg_type in ['ai', 'assistant', 'tool']:
                filtered.append(msg)
    return filtered


def extract_agent_response(result: Any) -> str:
    """Extract actual content from agent response.
    
    Args:
        result: Agent invoke result
        
    Returns:
        Extracted content string
    """
    if result and 'messages' in result and result['messages']:
        last_message = result['messages'][-1]
        if hasattr(last_message, 'content'):
            return last_message.content
        elif isinstance(last_message, dict):
            return last_message.get('content', str(result))
        else:
            return str(last_message)
    else:
        return str(result)


def send_phase_status(state: PlaybookState, phase_num: int, status: str, 
                      summary: str = None, duration: str = None) -> None:
    """Send structured phase status message to frontend.
    
    Uses a special format that frontend can parse to display clean progress UI.
    Also updates todos for task tracking.
    
    Args:
        state: Current playbook state
        phase_num: Phase number (1-7)
        status: Phase status - "started" | "progress" | "completed" | "error"
        summary: Brief summary of phase result (for completed status)
        duration: Execution duration like "2.3s" (for completed status)
    """
    # Phase name mapping
    PHASE_NAMES = {
        1: "Batch Overview",
        2: "Historical Trends", 
        3: "Content & Technical SEO",
        4: "Keyword Gap Analysis",
        5: "Competitive Benchmark",
        6: "Root Cause Investigation",
        7: "Report Generation",
    }
    
    message_data = {
        "type": "phase_status",
        "phase": phase_num,
        "status": status,
        "summary": summary,
        "duration": duration,
    }
    
    # Use special markers for frontend parsing
    content = f"__PHASE_STATUS__{json.dumps(message_data, ensure_ascii=False)}__"
    state['messages'].append(AIMessage(content=content))
    
    # 更新 todos 以显示在 Tasks 区域
    if 'todos' not in state:
        state['todos'] = []
    
    todo_id = f"phase_{phase_num}"
    phase_name = PHASE_NAMES.get(phase_num, f"Phase {phase_num}")
    
    # 查找是否已存在该 phase 的 todo
    existing_todo_index = None
    for i, todo in enumerate(state['todos']):
        if todo.get('id') == todo_id:
            existing_todo_index = i
            break
    
    # 根据状态创建或更新 todo (no emoji - frontend handles icons)
    if status == "started":
        todo_status = "in_progress"
        todo_content = phase_name
    elif status == "completed":
        todo_status = "completed"
        todo_content = phase_name
    elif status == "error":
        todo_status = "cancelled"
        todo_content = phase_name
    else:  # progress
        todo_status = "in_progress"
        todo_content = phase_name
    
    new_todo = {
        "id": todo_id,
        "content": todo_content,
        "status": todo_status
    }
    
    if existing_todo_index is not None:
        state['todos'][existing_todo_index] = new_todo
    else:
        state['todos'].append(new_todo)
    
    logger.info(f"[PHASE {phase_num}] Status: {status} | Summary: {summary}")


def generate_phase_summary(content: str, phase: int) -> str:
    """Generate a concise summary from detailed phase output.
    
    Extracts key insights from the full output to show in collapsed view.
    
    Args:
        content: Full phase output content
        phase: Phase number
        
    Returns:
        Concise summary string (max ~150 chars)
    """
    # Try to extract key findings/insights from content
    content_lower = content.lower()
    
    # Look for common summary patterns
    patterns = [
        ('key findings:', 'key findings:'),
        ('key insights:', 'key insights:'),
        ('summary:', 'summary:'),
        ('💡', '💡'),
        ('highlights:', 'highlights:'),
    ]
    
    for pattern, marker in patterns:
        if pattern in content_lower:
            # Find the line after the marker
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if pattern in line.lower():
                    # Get the next non-empty line
                    for j in range(i + 1, min(i + 5, len(lines))):
                        next_line = lines[j].strip()
                        # Remove markdown bullets
                        next_line = next_line.lstrip('-•*').strip()
                        if next_line and len(next_line) > 10:
                            # Limit length
                            if len(next_line) > 150:
                                return next_line[:147] + "..."
                            return next_line
    
    # Fallback: Use predefined summaries based on phase number
    default_summaries = {
        1: "SEO overview data retrieved, traffic and keyword comparison complete",
        2: "12-month historical trends analyzed, fluctuation detection complete",
        3: "Content structure, technical SEO and UX analysis complete",
        4: "Keyword gap analysis complete, competitive opportunities identified",
        5: "Competitive benchmark complete, industry comparison done",
        6: "Traffic fluctuation root cause investigation complete",
        7: "Full audit report generated, HTML and DOCX versions ready",
    }
    
    return default_summaries.get(phase, f"Phase {phase} 执行完成")


def detect_fluctuations_from_output(output: str) -> bool:
    """Detect if Phase 6 investigation is required from Phase 2 output.
    
    Analyzes Phase 2 output for keywords indicating fluctuations were detected.
    
    Args:
        output: Phase 2 output content
        
    Returns:
        True if Phase 6 investigation is needed, False otherwise
    """
    output_lower = output.lower()
    
    # Look for investigation requirement indicators
    investigation_keywords = [
        'phase 6 investigation required',
        'investigation: yes',
        'requires investigation',
        '| yes |',  # Table format
        'fluctuations detected',
    ]
    
    for keyword in investigation_keywords:
        if keyword in output_lower:
            logger.info(f"[FLUCTUATION DETECTION] Found keyword: '{keyword}'")
            # Additional check: make sure it's not "NO" investigation
            if '| no |' in output_lower or 'investigation: no' in output_lower:
                continue
            return True
    
    return False


def execute_phase_1(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 1: Batch Overview.
    
    Calls semrush_domain_overview_batch for all domains.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase1_overview populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 1] Starting Batch Overview")
    
    # Send phase started status to frontend
    send_phase_status(state, 1, "started")
    
    # Render phase prompt
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=1,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        }
    )
    
    # Execute with agent
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        # Generate concise summary for frontend
        summary = generate_phase_summary(response_content, phase=1)
        duration = f"{time.time() - start_time:.1f}s"
        
        # Parse result
        state['phase1_overview'] = {
            'success': True,
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,  # Keep for backward compatibility
        }
        
        state['phases_completed'].append(1)
        state['current_phase'] = 2
        
        logger.info("[PHASE 1] ✅ Completed")
        logger.info(f"[PHASE 1] Response length: {len(response_content)} chars")
        logger.info(f"[PHASE 1] Summary: {summary}")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        # Send phase completed status to frontend
        send_phase_status(state, 1, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 1] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 1 failed: {error_msg}")
        # Send error status to frontend
        send_phase_status(state, 1, "error", error_msg)
    
    return state


def execute_phase_2(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 2: Historical Trends + MoM Analysis.
    
    Calls semrush_domain_history for each domain and calculates metrics.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase2_history populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 2] Starting Historical Trends Analysis")
    send_phase_status(state, 2, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=2,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        # Detect if Phase 6 investigation is required
        requires_investigation = detect_fluctuations_from_output(response_content)
        
        # Generate summary
        summary = generate_phase_summary(response_content, phase=2)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase2_history'] = {
            'success': True,
            'requires_investigation': requires_investigation,
            'investigation_domains': [],
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,
        }
        
        state['phases_completed'].append(2)
        state['current_phase'] = 3
        
        logger.info("[PHASE 2] ✅ Completed")
        logger.info(f"[PHASE 2] Response length: {len(response_content)} chars")
        logger.info(f"[PHASE 2] Requires investigation: {requires_investigation}")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        send_phase_status(state, 2, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 2] ❌ Error: {e}")
        error_msg = str(e)
        
        # Set default phase2_history even on error to prevent routing issues
        state['phase2_history'] = {
            'success': False,
            'requires_investigation': False,  # Skip Phase 6 on error
            'investigation_domains': [],
            'summary': None,
            'details': None,
            'duration': None,
            'error': error_msg,
        }
        
        # Mark phase as attempted and move to next phase
        state['phases_completed'].append(2)
        state['current_phase'] = 3
        
        state['errors'].append(f"Phase 2 failed: {error_msg}")
        send_phase_status(state, 2, "error", error_msg)
    
    return state


def execute_phase_3(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 3: Deep Content + Technical SEO Analysis.
    
    Analyzes pages, keywords, backlinks, technical SEO, and UX.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase3_content populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 3] Starting Content & Technical SEO Analysis")
    send_phase_status(state, 3, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=3,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        summary = generate_phase_summary(response_content, phase=3)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase3_content'] = {
            'success': True,
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,
        }
        
        state['phases_completed'].append(3)
        state['current_phase'] = 4
        
        logger.info("[PHASE 3] ✅ Completed")
        logger.info(f"[PHASE 3] Response length: {len(response_content)} chars")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        send_phase_status(state, 3, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 3] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 3 failed: {error_msg}")
        send_phase_status(state, 3, "error", error_msg)
    
    return state


def execute_phase_4(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 4: Competitive Gap Analysis.
    
    Finds keywords competitors rank for but my_domain doesn't.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase4_gaps populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 4] Starting Keyword Gap Analysis")
    send_phase_status(state, 4, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=4,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        summary = generate_phase_summary(response_content, phase=4)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase4_gaps'] = {
            'success': True,
            'has_my_domain': bool(state.get('my_domain')),
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,
        }
        
        state['phases_completed'].append(4)
        state['current_phase'] = 5
        
        logger.info("[PHASE 4] ✅ Completed")
        logger.info(f"[PHASE 4] Response length: {len(response_content)} chars")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        send_phase_status(state, 4, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 4] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 4 failed: {error_msg}")
        send_phase_status(state, 4, "error", error_msg)
    
    return state


def execute_phase_5(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 5: Track Popularity Benchmarking.
    
    Compares user's track against a trending reference track.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase5_benchmark populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 5] Starting Track Benchmarking")
    send_phase_status(state, 5, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=5,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        summary = generate_phase_summary(response_content, phase=5)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase5_benchmark'] = {
            'success': True,
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,
        }
        
        state['phases_completed'].append(5)
        state['current_phase'] = 6
        
        logger.info("[PHASE 5] ✅ Completed")
        logger.info(f"[PHASE 5] Response length: {len(response_content)} chars")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        send_phase_status(state, 5, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 5] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 5 failed: {error_msg}")
        send_phase_status(state, 5, "error", error_msg)
    
    return state


def execute_phase_6(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 6: Root Cause Investigation (if required).
    
    Performs 50 searches per fluctuation to find root causes.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase6_investigation populated
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 6] Starting Root Cause Investigation")
    send_phase_status(state, 6, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=6,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual response content
        response_content = extract_agent_response(result)
        
        summary = generate_phase_summary(response_content, phase=6)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase6_investigation'] = {
            'executed': True,
            'summary': summary,
            'details': response_content,
            'duration': duration,
            'raw_output': response_content,
        }
        
        state['phases_completed'].append(6)
        state['current_phase'] = 7
        
        logger.info("[PHASE 6] ✅ Completed")
        logger.info(f"[PHASE 6] Response length: {len(response_content)} chars")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        send_phase_status(state, 6, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 6] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 6 failed: {error_msg}")
        send_phase_status(state, 6, "error", error_msg)
    
    return state


def execute_phase_7(state: PlaybookState, agent: Any) -> PlaybookState:
    """Execute Phase 7: Report Generation.
    
    Generates comprehensive markdown + HTML + DOCX report.
    
    Args:
        state: Current playbook state
        agent: LangGraph agent instance
    
    Returns:
        Updated state with phase7_report and final output
    """
    import time
    start_time = time.time()
    
    logger.info("[PHASE 7] Starting Report Generation")
    send_phase_status(state, 7, "started")
    
    prompt = render_phase_prompt(
        playbook_id=state['playbook_id'],
        phase_number=7,
        params={
            'competitor_domains': state['competitor_domains'],
            'my_domain': state.get('my_domain'),
            'primary_market': state['primary_market'],
        },
        previous_phase_data=state
    )
    
    try:
        result = agent.invoke({"messages": [HumanMessage(content=prompt)]})
        
        # Extract actual report content from agent response
        if result and 'messages' in result and result['messages']:
            last_message = result['messages'][-1]
            if hasattr(last_message, 'content'):
                report_content = last_message.content
            elif isinstance(last_message, dict):
                report_content = last_message.get('content', str(result))
            else:
                report_content = str(last_message)
        else:
            report_content = str(result)
        
        summary = generate_phase_summary(report_content, phase=7)
        duration = f"{time.time() - start_time:.1f}s"
        
        state['phase7_report'] = {
            'success': True,
            'summary': summary,
            'details': report_content,
            'duration': duration,
            'raw_output': report_content,
        }
        
        state['phases_completed'].append(7)
        state['current_phase'] = 7  # Final phase
        
        # Generate execution summary
        state['execution_summary'] = {
            'total_phases': 7,
            'phases_executed': len(state['phases_completed']),
            'errors': state['errors'],
        }
        
        logger.info("[PHASE 7] ✅ Completed")
        logger.info(f"[PHASE 7] Report length: {len(report_content)} chars")
        logger.info(f"[PLAYBOOK] ✅ All phases completed: {state['phases_completed']}")
        
        # Add only AI and Tool messages (filter out phase instruction HumanMessage)
        if 'messages' in result:
            filtered_messages = filter_phase_messages(result['messages'])
            state['messages'].extend(filtered_messages)
        
        # IMPORTANT: Merge files from agent result to playbook state for artifacts display
        # When markdown_to_html_report tool returns Command(update={"files": {...}}),
        # those files are applied to the sub-agent's state - we need to copy them to playbook state
        if 'files' in result and result['files']:
            existing_files = state.get('files', {})
            if existing_files is None:
                existing_files = {}
            existing_files.update(result['files'])
            state['files'] = existing_files
            logger.info(f"[PHASE 7] Merged {len(result['files'])} file(s) to artifacts")
        
        send_phase_status(state, 7, "completed", summary, duration)
        
    except Exception as e:
        logger.error(f"[PHASE 7] ❌ Error: {e}")
        error_msg = str(e)
        state['errors'].append(f"Phase 7 failed: {error_msg}")
        send_phase_status(state, 7, "error", error_msg)
    
    return state

