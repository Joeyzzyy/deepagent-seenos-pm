"""Test script for report generation tools."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.reports import get_report_tools

# Sample Markdown report with tables
SAMPLE_MARKDOWN = """# Competitor SEO Growth Engine Audit Report

**Analysis Date:** 2025-01-09
**Domains Analyzed:** 3 competitors
**Primary Market:** United States

---

## Executive Summary

Competitor1.com dominates with 450K monthly organic visits (85% SEO-driven), powered by a PSEO strategy generating 45+ template pages. Their traffic spiked 38% in March 2024 due to a new template launch.

---

## SEO vs PPC Overview (US Market)

| Domain | Organic Traffic (visits/month) | Paid Traffic (visits/month) | Organic % | Keywords Count | Strategy Type |
|--------|-------------------------------|----------------------------|-----------|---------------|---------------|
| competitor1.com | 450,000 | 15,000 | 96.8% | 12,500 | SEO-dominant |
| competitor2.com | 380,000 | 8,000 | 97.9% | 9,800 | SEO-dominant |
| competitor3.com | 220,000 | 85,000 | 72.1% | 7,200 | Balanced |

**Key Findings:**
- **Top SEO Performer:** competitor1.com with 450,000 monthly organic visits
- **SEO vs PPC Split:** 2 competitors are SEO-dominant (>80% organic)

---

## 6-Month Traffic Trend (US Market)

| Month | Organic Traffic (visits/month) | Keywords Count | MoM Change |
|-------|-------------------------------|---------------|------------|
| 2024-01 | 420,000 | 11,800 | - |
| 2024-02 | 450,000 | 12,200 | +7.1% |
| 2024-03 | 620,000 | 14,500 | +37.8% |
| 2024-04 | 610,000 | 14,300 | -1.6% |
| 2024-05 | 625,000 | 14,600 | +2.5% |
| 2024-06 | 640,000 | 14,800 | +2.4% |

**Overall Trend:** Growing (+52.4% over 6 months)

---

## Traffic Fluctuation Root Cause Analysis

### SPIKE ANALYSIS: March 2024 (+37.8%)

**What Happened:**
- Traffic increased from 450,000 → 620,000 visits (+170,000 visits, +37.8%)
- Keywords increased from 12,200 → 14,500 (+2,300 keywords, +18.9%)

**Investigation Process:**

| Data Source | Tool Used | Finding |
|-------------|----------|---------|
| **Organic Pages** | `semrush_domain_organic_pages` | Detected 45 new pages matching pattern: `/templates/*` |
| **Keyword Data** | `semrush_organic_keywords` | New rankings for: "free resume template", "project plan template" |
| **Web Search** | `tavily_search` | Found: "Competitor1 launches AI-powered template generator" |

**Root Cause Conclusion:**

> **Category:** Content Launch (PSEO Success)
> **Confidence:** High
> 
> Competitor1 launched a programmatic SEO (PSEO) strategy by publishing 45+ template pages in March 2024.

**SEO Lessons:**
1. **PSEO Works:** Programmatic SEO can drive massive traffic quickly
2. **Template Content:** High search volume + low competition = quick wins

---

## Strategic Insights

### 1. Industry Benchmarks (US Market)

| Metric | Top Performer | Market Average |
|--------|--------------|----------------|
| **Organic Traffic** | 450,000/mo | 253,000/mo |
| **Keywords Count** | 12,500 | 8,060 |
| **Authority Score** | 68 | 56.8 |

### 2. Growth Engine Patterns

**Content-Driven Growth:**
- **Who:** Competitor1, Competitor2
- **Strategy:** PSEO + Long-tail content marketing
- **Result:** High keyword count, diversified traffic

---

## Recommendations

### Immediate Actions (High Priority)

1. **Replicate PSEO Strategy**
   - **What:** Build 30-50 template/tool pages targeting long-tail keywords
   - **Why:** Competitor1 gained +170K traffic using this strategy
   - **Expected Result:** +100K-150K monthly visits within 3-6 months

2. **Target Competitor Weaknesses**
   - **What:** Create content for high-volume keywords where competitors rank poorly
   - **Expected Result:** +50K monthly visits

---

## Data Notes

- Traffic data is **estimated** based on keyword rankings
- Data is for **United States market only**
- Use for competitive benchmarking and strategy analysis
"""


def test_html_report():
    """Test HTML report generation."""
    print("Testing HTML report generation...")
    
    tools = get_report_tools()
    
    # Find markdown_to_html_report tool
    html_tool = None
    for tool in tools:
        if tool.__name__ == 'markdown_to_html_report':
            html_tool = tool
            break
    
    if not html_tool:
        print("❌ markdown_to_html_report tool not found")
        return False
    
    # Generate report
    result = html_tool(
        markdown_content=SAMPLE_MARKDOWN,
        title="Test Competitor SEO Audit Report",
        user_id="test_user",
        conversation_id="test_conv"
    )
    
    if result.get('success'):
        print(f"✅ HTML report generated successfully")
        print(f"   File: {result.get('file_path')}")
        print(f"   Size: {result.get('file_size')} bytes")
        print(f"   Charts: {result.get('charts_generated')} charts generated")
        print(f"   URL: {result.get('file_url')}")
        return True
    else:
        print(f"❌ HTML report generation failed: {result.get('error')}")
        return False


def test_docx_report():
    """Test DOCX report generation."""
    print("\nTesting DOCX report generation...")
    
    tools = get_report_tools()
    
    # Find markdown_to_docx tool
    docx_tool = None
    for tool in tools:
        if tool.__name__ == 'markdown_to_docx':
            docx_tool = tool
            break
    
    if not docx_tool:
        print("❌ markdown_to_docx tool not found")
        return False
    
    # Generate report
    result = docx_tool(
        markdown_content=SAMPLE_MARKDOWN,
        filename="test-competitor-audit.docx",
        user_id="test_user",
        conversation_id="test_conv"
    )
    
    if result.get('success'):
        print(f"✅ DOCX report generated successfully")
        print(f"   File: {result.get('file_path')}")
        print(f"   Size: {result.get('file_size')} bytes")
        print(f"   URL: {result.get('file_url')}")
        return True
    else:
        print(f"❌ DOCX report generation failed: {result.get('error')}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Report Generation Tools Test")
    print("=" * 60)
    
    html_success = test_html_report()
    docx_success = test_docx_report()
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"HTML Report: {'✅ PASS' if html_success else '❌ FAIL'}")
    print(f"DOCX Report: {'✅ PASS' if docx_success else '❌ FAIL'}")
    
    if html_success and docx_success:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️ Some tests failed. Check dependencies:")
        print("   pip install markdown python-docx")

