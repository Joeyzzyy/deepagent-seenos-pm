#!/usr/bin/env python3
"""
Test script for Semrush domain_rank_history API
This will help diagnose why historical data is not being retrieved
"""

import os
import sys
import logging

# Setup logging to see all details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.semrush import get_semrush_tools

def test_domain_history():
    """Test semrush_domain_history with detailed logging"""
    print("=" * 80)
    print("🔍 SEMRUSH DOMAIN_RANK_HISTORY API TEST")
    print("=" * 80)
    print()
    
    # Get tools
    tools = get_semrush_tools()
    if not tools:
        print("❌ No Semrush tools available (check API key)")
        return
    
    # Find domain_history tool
    domain_history = None
    for tool in tools:
        if hasattr(tool, '__name__') and tool.__name__ == 'semrush_domain_history':
            domain_history = tool
            break
    
    if not domain_history:
        print("❌ semrush_domain_history tool not found")
        return
    
    print("✅ Found semrush_domain_history tool")
    print()
    
    # Test with writesonic.com
    test_domain = "writesonic.com"
    print(f"📊 Testing with domain: {test_domain}")
    print(f"📅 Requesting 12 months of data")
    print(f"🌍 Database: us")
    print()
    print("-" * 80)
    print()
    
    # Call the API
    result = domain_history(test_domain, database='us', months=12)
    
    print()
    print("-" * 80)
    print()
    print("📋 RESULT SUMMARY:")
    print(f"  Success: {result.get('success')}")
    print(f"  Domain: {result.get('domain')}")
    
    if result.get('success'):
        history = result.get('history', [])
        print(f"  ✅ Months analyzed: {result.get('months_analyzed', 0)}")
        print(f"  ✅ History entries: {len(history)}")
        
        if history:
            print()
            print("📈 SAMPLE DATA (first 3 months):")
            for i, month in enumerate(history[:3], 1):
                print(f"  {i}. {month['date']}: Traffic={month['organic_traffic']:,}, Keywords={month['organic_keywords']:,}")
        else:
            print()
            print("  ⚠️ WARNING: History array is EMPTY!")
            print("  This means API returned success but no data")
        
        # Check fluctuations
        investigation = result.get('fluctuation_investigation', {})
        fluctuations = investigation.get('detected_fluctuations', [])
        if fluctuations:
            print()
            print(f"  🔍 Fluctuations detected: {len(fluctuations)}")
            for fluc in fluctuations:
                print(f"    - {fluc['month']}: {fluc['type']} ({fluc['change_percent']}%)")
    else:
        print(f"  ❌ Error: {result.get('error')}")
        if result.get('raw_response'):
            print()
            print("  📄 Raw API Response:")
            print(f"    {result.get('raw_response')[:500]}")
    
    if result.get('api_url'):
        print()
        print(f"  🔗 API URL: {result.get('api_url')}")
    
    print()
    print("=" * 80)
    print()
    
    # Test with seopage.ai
    test_domain2 = "seopage.ai"
    print(f"📊 Testing with domain: {test_domain2}")
    print()
    print("-" * 80)
    print()
    
    result2 = domain_history(test_domain2, database='us', months=12)
    
    print()
    print("-" * 80)
    print()
    print("📋 RESULT SUMMARY:")
    print(f"  Success: {result2.get('success')}")
    print(f"  Domain: {result2.get('domain')}")
    
    if result2.get('success'):
        history2 = result2.get('history', [])
        print(f"  Months analyzed: {result2.get('months_analyzed', 0)}")
        print(f"  History entries: {len(history2)}")
        
        if history2:
            print()
            print("📈 SAMPLE DATA (first 3 months):")
            for i, month in enumerate(history2[:3], 1):
                print(f"  {i}. {month['date']}: Traffic={month['organic_traffic']:,}, Keywords={month['organic_keywords']:,}")
        else:
            print()
            print("  ⚠️ WARNING: History array is EMPTY!")
    else:
        print(f"  ❌ Error: {result2.get('error')}")
    
    print()
    print("=" * 80)
    print()
    print("✅ Test completed. Check logs above for details.")
    print()

if __name__ == "__main__":
    test_domain_history()

