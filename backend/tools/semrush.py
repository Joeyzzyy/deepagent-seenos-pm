"""Semrush SEO analysis tools."""

import logging
import os

from .config import load_config_file, get_enabled_tools

logger = logging.getLogger(__name__)


def get_semrush_tools() -> list:
    """Get Semrush API tools if API key is configured.
    
    Returns:
        List of tools if Semrush is configured, empty list otherwise.
        
    Available tools:
        - semrush_domain_overview: Get overall SEO metrics for a domain
        - semrush_domain_overview_batch: Batch analyze multiple domains at once
        - semrush_domain_history: Get 6-12 month traffic trends (KEY for growth analysis!)
        - semrush_domain_organic_pages: Get top traffic-driving pages (PSEO detection)
        - semrush_organic_keywords: Get organic search keywords for a domain
        - semrush_backlinks_overview: Get backlink profile summary
        - semrush_backlink_history: Get backlink trend over time
        - semrush_backlinks_list: Get list of individual backlinks
        - semrush_keyword_gap: Compare keywords between two domains
        - semrush_traffic_analytics: Get traffic analytics data
    """
    config = load_config_file()
    semrush_api_key = config.get("semrush_api_key") if config else None
    
    if not semrush_api_key:
        semrush_api_key = os.environ.get("SEMRUSH_API_KEY")
    
    if not semrush_api_key:
        logger.info("[SEMRUSH] No Semrush API key configured, SEO tools disabled")
        return []
    
    try:
        import requests
        
        BASE_URL = "https://api.semrush.com"
        ANALYTICS_URL = "https://api.semrush.com/analytics/v1"
        
        # ============================================================
        # Helper Function: Check for Semrush API Errors
        # ============================================================
        def check_semrush_error(text: str, domain: str) -> dict | None:
            """Check if response contains Semrush API error.
            
            Semrush API returns errors with HTTP 200 status code!
            Error format: "ERROR XX :: MESSAGE"
            
            Returns:
                Error dict if error found, None if no error
            """
            if text.startswith("ERROR"):
                logger.warning(f"[SEMRUSH] API error for {domain}: {text[:100]}")
                
                # ERROR 50 :: NOTHING FOUND (not really an error, just no data)
                if "NOTHING FOUND" in text or "ERROR 50" in text:
                    return {
                        "success": True,
                        "no_data": True,
                        "domain": domain,
                        "message": "No data found for this domain in Semrush database"
                    }
                
                # ERROR 30 :: NOT ENOUGH UNITS (quota exceeded)
                if "NOT ENOUGH UNITS" in text or "ERROR 30" in text:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "API quota exceeded. Please check your Semrush account."
                    }
                
                # ERROR 40 :: WRONG KEY (invalid API key)
                if "WRONG KEY" in text or "ERROR 40" in text:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "Invalid Semrush API key. Please check SEMRUSH_API_KEY configuration."
                    }
                
                # Other errors
                return {
                    "success": False,
                    "domain": domain,
                    "error": f"Semrush API error: {text}"
                }
            
            return None
        
        # ============================================================
        # Tool 1: Domain Overview
        # ============================================================
        def semrush_domain_overview(
            domain: str,
            database: str = "us",
        ) -> dict:
            """Get overall SEO metrics for a domain.
            
            Returns organic traffic, keywords count, backlinks, and authority score.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                database: Country database code (default 'us'). Options: us, uk, de, fr, etc.
            
            Returns:
                Dictionary with organic_keywords, organic_traffic, authority_score, etc.
            """
            try:
                params = {
                    "type": "domain_ranks",
                    "key": semrush_api_key,
                    "export_columns": "Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv",
                    "domain": domain,
                    "database": database,
                }
                logger.info(f"[SEMRUSH] Fetching domain overview for {domain} (database: {database})")
                response = requests.get(BASE_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors (ERROR XX :: MESSAGE)
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    return error_result
                
                # Parse CSV response
                lines = text.split("\n")
                if len(lines) < 2:
                    logger.warning(f"[SEMRUSH] Unexpected response format for {domain}: {text[:200]}")
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "Unexpected response format from Semrush API",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                values = [v.strip() for v in lines[1].split(";")]
                data = dict(zip(headers, values))
                
                # Semrush API returns full column names in headers, not abbreviations
                organic_traffic = data.get("Organic Traffic", data.get("Ot", "0")) or "0"
                organic_keywords = data.get("Organic Keywords", data.get("Or", "0"))
                
                logger.info(f"[SEMRUSH] Successfully fetched data for {domain}: {organic_traffic} organic traffic")
                
                return {
                    "success": True,
                    "domain": domain,
                    "database": database,
                    "rank": data.get("Rank", data.get("Rk", "N/A")),
                    "organic_keywords": organic_keywords,
                    "organic_traffic": organic_traffic,
                    "organic_cost": data.get("Organic Cost", data.get("Oc", "0")),
                    "adwords_keywords": data.get("Adwords Keywords", data.get("Ad", "0")),
                    "adwords_traffic": data.get("Adwords Traffic", data.get("At", "0")),
                    "adwords_cost": data.get("Adwords Cost", data.get("Ac", "0")),
                }
            except Exception as e:
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 2: Organic Keywords
        # ============================================================
        def semrush_organic_keywords(
            domain: str,
            database: str = "us",
            limit: int = 20,
        ) -> dict:
            """Get organic search keywords that a domain ranks for.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                database: Country database code (default 'us')
                limit: Maximum number of keywords to return (default 20, max 100)
            
            Returns:
                Dictionary with list of keywords, positions, search volumes
            """
            try:
                limit = min(limit, 100)
                params = {
                    "type": "domain_organic",
                    "key": semrush_api_key,
                    "export_columns": "Ph,Po,Nq,Cp,Ur,Tr,Tc,Kd",
                    "domain": domain,
                    "database": database,
                    "display_limit": limit,
                    "display_sort": "tr_desc",  # Sort by traffic percentage (descending)
                }
                logger.info(f"[SEMRUSH] Fetching organic keywords for {domain} (limit: {limit})")
                response = requests.get(BASE_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    # If no data, return empty keywords list
                    if error_result.get("no_data"):
                        return {
                            "success": True,
                            "domain": domain,
                            "database": database,
                            "keywords": [],
                            "total_keywords": 0,
                            "message": "No organic keywords found in Semrush database"
                        }
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": True,
                        "domain": domain,
                        "database": database,
                        "keywords": [],
                        "total_keywords": 0,
                        "message": "No organic keywords found",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                keywords = []
                for line in lines[1:]:
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]
                    data = dict(zip(headers, values))
                    keywords.append({
                        "keyword": data.get("Ph", ""),
                        "position": data.get("Po", ""),
                        "search_volume": data.get("Nq", "0"),
                        "cpc": data.get("Cp", "0"),
                        "url": data.get("Ur", ""),
                        "traffic_percent": data.get("Tr", "0"),
                        "traffic_cost": data.get("Tc", "0"),
                        "difficulty": data.get("Kd", "0"),
                    })
                
                logger.info(f"[SEMRUSH] Found {len(keywords)} keywords for {domain}")
                return {
                    "success": True,
                    "domain": domain,
                    "database": database,
                    "total_keywords": len(keywords),
                    "keywords": keywords,
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching keywords for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 3: Backlinks Overview
        # ============================================================
        def semrush_backlinks_overview(
            domain: str,
        ) -> dict:
            """Get backlink profile summary for a domain.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
            
            Returns:
                Dictionary with total backlinks, referring domains, authority score
            """
            try:
                params = {
                    "type": "backlinks_overview",
                    "key": semrush_api_key,
                    "target": domain,
                    "target_type": "root_domain",
                    "export_columns": "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num",
                }
                logger.info(f"[SEMRUSH] Fetching backlinks overview for {domain}")
                response = requests.get(ANALYTICS_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "Unexpected response format from Semrush API",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                values = [v.strip() for v in lines[1].split(";")]
                data = dict(zip(headers, values))
                
                logger.info(f"[SEMRUSH] Backlinks for {domain}: {data.get('total', '0')} total, {data.get('domains_num', '0')} domains")
                return {
                    "success": True,
                    "domain": domain,
                    "authority_score": data.get("ascore", "0"),
                    "total_backlinks": data.get("total", "0"),
                    "referring_domains": data.get("domains_num", "0"),
                    "referring_urls": data.get("urls_num", "0"),
                    "referring_ips": data.get("ips_num", "0"),
                    "dofollow_links": data.get("follows_num", "0"),
                    "nofollow_links": data.get("nofollows_num", "0"),
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching backlinks for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 4: Backlinks List
        # ============================================================
        def semrush_backlinks_list(
            domain: str,
            limit: int = 20,
        ) -> dict:
            """Get list of individual backlinks pointing to a domain.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                limit: Maximum number of backlinks to return (default 20, max 100)
            
            Returns:
                Dictionary with list of backlinks including source URL, anchor text
            """
            try:
                limit = min(limit, 100)
                params = {
                    "type": "backlinks",
                    "key": semrush_api_key,
                    "target": domain,
                    "target_type": "root_domain",
                    "export_columns": "source_url,source_title,target_url,anchor,external_num,internal_num,first_seen,last_seen",
                    "display_limit": limit,
                }
                logger.info(f"[SEMRUSH] Fetching backlinks list for {domain} (limit: {limit})")
                response = requests.get(ANALYTICS_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    if error_result.get("no_data"):
                        return {
                            "success": True,
                            "domain": domain,
                            "backlinks": [],
                            "total_returned": 0,
                            "message": "No backlinks found"
                        }
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": True,
                        "domain": domain,
                        "backlinks": [],
                        "total_returned": 0,
                        "message": "No backlinks found",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                backlinks = []
                for line in lines[1:]:
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]
                    data = dict(zip(headers, values))
                    backlinks.append({
                        "source_url": data.get("source_url", ""),
                        "source_title": data.get("source_title", ""),
                        "target_url": data.get("target_url", ""),
                        "anchor_text": data.get("anchor", ""),
                        "first_seen": data.get("first_seen", ""),
                        "last_seen": data.get("last_seen", ""),
                    })
                
                logger.info(f"[SEMRUSH] Found {len(backlinks)} backlinks for {domain}")
                return {
                    "success": True,
                    "domain": domain,
                    "total_returned": len(backlinks),
                    "backlinks": backlinks,
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching backlinks list for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 5: Keyword Gap Analysis
        # ============================================================
        def semrush_keyword_gap(
            target_domain: str,
            competitor_domain: str,
            database: str = "us",
            limit: int = 20,
        ) -> dict:
            """Compare keywords between two domains to find gap opportunities.
            
            Identifies keywords that the competitor ranks for but target domain does not.
            
            Args:
                target_domain: Your domain (e.g., 'yoursite.com')
                competitor_domain: Competitor domain (e.g., 'competitor.com')
                database: Country database code (default 'us')
                limit: Maximum number of gap keywords to return (default 20, max 100)
            
            Returns:
                Dictionary with keywords that competitor has but you don't
            """
            try:
                limit = min(limit, 100)
                params = {
                    "type": "domain_domains",
                    "key": semrush_api_key,
                    "domains": f"{target_domain}|{competitor_domain}",
                    "database": database,
                    "export_columns": "Dn,Cr,Np,Cp,Nq,Kd",
                    "display_limit": limit,
                    "display_filter": "+|Nq|Gt|100",  # Search volume > 100
                }
                logger.info(f"[SEMRUSH] Fetching keyword gap: {target_domain} vs {competitor_domain}")
                response = requests.get(BASE_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "target_domain": target_domain,
                        "competitor_domain": competitor_domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, f"{target_domain} vs {competitor_domain}")
                if error_result:
                    if error_result.get("no_data"):
                        return {
                            "success": True,
                            "target_domain": target_domain,
                            "competitor_domain": competitor_domain,
                            "database": database,
                            "gap_keywords": [],
                            "total_gaps": 0,
                            "message": "No keyword gaps found"
                        }
                    return {**error_result, "target_domain": target_domain, "competitor_domain": competitor_domain}
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": True,
                        "target_domain": target_domain,
                        "competitor_domain": competitor_domain,
                        "database": database,
                        "gap_keywords": [],
                        "total_gaps": 0,
                        "message": "No keyword gaps found",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                domains = []
                for line in lines[1:]:
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]
                    data = dict(zip(headers, values))
                    domains.append({
                        "domain": data.get("Dn", ""),
                        "common_keywords": data.get("Cr", "0"),
                        "total_keywords": data.get("Np", "0"),
                        "avg_cpc": data.get("Cp", "0"),
                        "total_volume": data.get("Nq", "0"),
                        "avg_difficulty": data.get("Kd", "0"),
                    })
                
                logger.info(f"[SEMRUSH] Found {len(domains)} domain comparison results")
                return {
                    "success": True,
                    "target_domain": target_domain,
                    "competitor_domain": competitor_domain,
                    "database": database,
                    "domains": domains,
                    "note": "To get specific gap keywords, use semrush_organic_keywords for each domain and compare manually"
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching keyword gap: {e}")
                return {
                    "success": False,
                    "target_domain": target_domain,
                    "competitor_domain": competitor_domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 6: Domain Overview Batch (批量分析)
        # ============================================================
        def semrush_domain_overview_batch(
            domains: list,
            database: str = "us",
        ) -> dict:
            """Get SEO metrics for multiple domains at once.
            
            Args:
                domains: List of domains to analyze (e.g., ['site1.com', 'site2.com'])
                database: Country database code (default 'us')
            
            Returns:
                Dictionary with results for each domain
            """
            try:
                logger.info(f"[SEMRUSH] Batch analysis for {len(domains)} domains: {', '.join(domains)}")
                results = []
                success_count = 0
                
                for domain in domains:
                    result = semrush_domain_overview(domain, database)
                    results.append(result)
                    if result.get("success") and not result.get("no_data"):
                        success_count += 1
                
                logger.info(f"[SEMRUSH] Batch complete: {success_count}/{len(domains)} domains with data")
                return {
                    "success": True,
                    "database": database,
                    "total_domains": len(domains),
                    "domains_with_data": success_count,
                    "results": results,
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error in batch analysis: {e}")
                return {
                    "success": False,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 7: Domain History (历史流量趋势 - 关键工具!)
        # ============================================================
        def semrush_domain_history(
            domain: str,
            database: str = "us",
            months: int = 6,
        ) -> dict:
            """Get historical traffic trends for a domain over time.
            
            This is a CRITICAL tool for detecting growth patterns and spikes.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                database: Country database code (default 'us')
                months: Number of months to retrieve (default 6, max 12)
            
            Returns:
                Dictionary with monthly traffic data, keyword counts, and spike detection
            """
            try:
                from datetime import datetime, timedelta
                
                months = min(months, 12)
                params = {
                    "type": "domain_rank_history",
                    "key": semrush_api_key,
                    "export_columns": "Dt,Rk,Or,Ot,Oc,Ad,At,Ac",
                    "domain": domain,
                    "database": database,
                    "display_limit": months,
                }
                
                # 🔍 CRITICAL: Log the exact API request URL
                api_url = BASE_URL + "?" + "&".join([f"{k}={v if k != 'key' else 'YOUR_API_KEY'}" for k, v in params.items()])
                logger.info(f"[SEMRUSH] 🚀 CALLING domain_rank_history API")
                logger.info(f"[SEMRUSH] 📋 Request Details:")
                logger.info(f"  - Domain: {domain}")
                logger.info(f"  - Database: {database}")
                logger.info(f"  - Months: {months}")
                logger.info(f"  - API URL: {api_url}")
                
                response = requests.get(BASE_URL, params=params, timeout=30)
                
                # 🔍 Log response status and content preview
                logger.info(f"[SEMRUSH] 📥 Response Status: {response.status_code}")
                logger.info(f"[SEMRUSH] 📄 Response Preview (first 500 chars): {response.text[:500]}")
                
                if response.status_code != 200:
                    error_msg = f"HTTP error: {response.status_code} - {response.text[:200]}"
                    logger.error(f"[SEMRUSH] ❌ API call failed: {error_msg}")
                    return {
                        "success": False,
                        "domain": domain,
                        "error": error_msg,
                        "api_url": api_url,
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    logger.warning(f"[SEMRUSH] ⚠️ API returned error: {error_result.get('error', 'Unknown')}")
                    error_result["api_url"] = api_url
                    return error_result
                
                lines = text.split("\n")
                logger.info(f"[SEMRUSH] 📊 Response lines count: {len(lines)}")
                
                if len(lines) < 2:
                    error_msg = "Unexpected response format from Semrush API (less than 2 lines)"
                    logger.error(f"[SEMRUSH] ❌ {error_msg}")
                    logger.error(f"[SEMRUSH] Full response: {text}")
                    return {
                        "success": False,
                        "domain": domain,
                        "error": error_msg,
                        "api_url": api_url,
                        "raw_response": text,
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]  # Strip whitespace from headers
                logger.info(f"[SEMRUSH] 📑 Response headers: {headers}")
                
                # Create column mapping from full names to short codes
                column_map = {
                    "Date": "Dt",
                    "Rank": "Rk", 
                    "Organic Keywords": "Or",
                    "Organic Traffic": "Ot",
                    "Organic Cost": "Oc",
                    "Adwords Keywords": "Ad",
                    "Adwords Traffic": "At",
                    "Adwords Cost": "Ac"
                }
                
                history = []
                prev_traffic = None
                
                for line_idx, line in enumerate(lines[1:], 1):
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]  # Strip whitespace from values
                    data = dict(zip(headers, values))
                    
                    # Use column mapping to get correct field names
                    traffic = int(data.get("Organic Traffic", data.get("Ot", "0")) or "0")
                    keywords = int(data.get("Organic Keywords", data.get("Or", "0")) or "0")
                    date_str = data.get("Date", data.get("Dt", ""))
                    
                    # 🔍 Log first 3 data rows for verification
                    if line_idx <= 3:
                        logger.info(f"[SEMRUSH] 📈 Data row {line_idx}: Date={date_str}, Traffic={traffic}, Keywords={keywords}")
                    
                    # Calculate MoM change
                    mom_change = None
                    mom_percent = None
                    if prev_traffic is not None and prev_traffic > 0:
                        mom_change = traffic - prev_traffic
                        mom_percent = round((mom_change / prev_traffic) * 100, 1)
                    
                    history.append({
                        "date": date_str,
                        "rank": data.get("Rank", data.get("Rk", "N/A")),
                        "organic_keywords": keywords,
                        "organic_traffic": traffic,
                        "organic_cost": data.get("Organic Cost", data.get("Oc", "0")),
                        "mom_change": mom_change,
                        "mom_percent": mom_percent,
                    })
                    
                    prev_traffic = traffic
                
                logger.info(f"[SEMRUSH] ✅ Successfully parsed {len(history)} months of data")
                
                # Detect significant fluctuations
                fluctuations = []
                for i, month_data in enumerate(history):
                    if month_data["mom_percent"] is not None:
                        if abs(month_data["mom_percent"]) >= 15:
                            fluctuation_type = "spike" if month_data["mom_percent"] > 0 else "drop"
                            fluctuations.append({
                                "month": month_data["date"],
                                "type": fluctuation_type,
                                "change_percent": month_data["mom_percent"],
                                "traffic_before": history[i-1]["organic_traffic"],
                                "traffic_after": month_data["organic_traffic"],
                            })
                
                # Determine if investigation is required
                requires_investigation = len(fluctuations) > 0
                investigation_tasks = []
                if requires_investigation:
                    logger.info(f"[SEMRUSH] 🔍 Detected {len(fluctuations)} significant fluctuations")
                    for fluc in fluctuations:
                        logger.info(f"  - {fluc['month']}: {fluc['type']} ({fluc['change_percent']}%)")
                        investigation_tasks.append({
                            "month": fluc["month"],
                            "type": fluc["type"],
                            "actions": [
                                f"Call semrush_domain_organic_pages({domain}) to find page changes",
                                f"Call web_search('{domain} {fluc['month'][:7]} launch update') to find news",
                                f"Call web_search('Google algorithm update {fluc['month'][:7]}') to check algorithm changes",
                            ]
                        })
                else:
                    logger.info(f"[SEMRUSH] ✓ No significant fluctuations detected (all <15% MoM)")
                
                result = {
                    "success": True,
                    "domain": domain,
                    "database": database,
                    "months_analyzed": len(history),
                    "history": history,
                    "fluctuation_investigation": {
                        "requires_investigation": requires_investigation,
                        "detected_fluctuations": fluctuations,
                        "investigation_tasks": investigation_tasks,
                    },
                    "api_url": api_url,
                }
                
                logger.info(f"[SEMRUSH] 🎉 domain_rank_history completed successfully for {domain}")
                logger.info(f"[SEMRUSH] Summary: {len(history)} months, {len(fluctuations)} fluctuations")
                return result
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"[SEMRUSH] ❌ Exception in domain_history for {domain}: {error_msg}")
                logger.exception(e)  # Log full stack trace
                return {
                    "success": False,
                    "domain": domain,
                    "error": error_msg,
                }
        
        # ============================================================
        # Tool 8: Domain Organic Pages (页面分析)
        # ============================================================
        def semrush_domain_organic_pages(
            domain: str,
            database: str = "us",
            limit: int = 20,
        ) -> dict:
            """Get top organic pages driving traffic to a domain.
            
            Useful for detecting PSEO patterns and content strategies.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                database: Country database code (default 'us')
                limit: Maximum number of pages to return (default 20, max 50)
            
            Returns:
                Dictionary with top pages, their traffic, and keyword counts
            """
            try:
                limit = min(limit, 50)
                params = {
                    "type": "domain_organic_organic",
                    "key": semrush_api_key,
                    "export_columns": "Dn,Ur,Ot,Or,Fk",
                    "domain": domain,
                    "database": database,
                    "display_limit": limit,
                }
                logger.info(f"[SEMRUSH] Fetching organic pages for {domain} (limit: {limit})")
                response = requests.get(BASE_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    if error_result.get("no_data"):
                        return {
                            "success": True,
                            "domain": domain,
                            "database": database,
                            "pages": [],
                            "total_pages": 0,
                            "message": "No page data found",
                            "pseo_analysis": {"detected": False, "patterns": []}
                        }
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": True,
                        "domain": domain,
                        "database": database,
                        "pages": [],
                        "total_pages": 0,
                        "message": "No page data found",
                        "pseo_analysis": {"detected": False, "patterns": []}
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                pages = []
                url_patterns = {}
                
                for line in lines[1:]:
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]
                    data = dict(zip(headers, values))
                    url = data.get("Ur", "")
                    
                    pages.append({
                        "url": url,
                        "traffic": data.get("Ot", "0"),
                        "keywords": data.get("Or", "0"),
                        "first_keyword": data.get("Fk", ""),
                    })
                    
                    # Detect URL patterns for PSEO
                    if "/" in url:
                        path_parts = url.split("/")
                        if len(path_parts) >= 2:
                            pattern = f"/{path_parts[1]}/*"
                            url_patterns[pattern] = url_patterns.get(pattern, 0) + 1
                
                # Detect PSEO
                pseo_detected = any(count >= 5 for count in url_patterns.values())
                pseo_patterns = [pattern for pattern, count in url_patterns.items() if count >= 5]
                
                logger.info(f"[SEMRUSH] Found {len(pages)} pages for {domain}, PSEO detected: {pseo_detected}")
                return {
                    "success": True,
                    "domain": domain,
                    "database": database,
                    "total_pages": len(pages),
                    "pages": pages,
                    "pseo_analysis": {
                        "detected": pseo_detected,
                        "patterns": pseo_patterns,
                        "note": "PSEO = Programmatic SEO (many similar pages targeting long-tail keywords)"
                    }
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching organic pages for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 9: Backlink History (反链历史)
        # ============================================================
        def semrush_backlink_history(
            domain: str,
            months: int = 6,
        ) -> dict:
            """Get historical backlink profile changes over time.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
                months: Number of months to retrieve (default 6, max 12)
            
            Returns:
                Dictionary with monthly backlink counts and referring domain trends
            """
            try:
                months = min(months, 12)
                params = {
                    "type": "backlinks_historical",
                    "key": semrush_api_key,
                    "target": domain,
                    "target_type": "root_domain",
                    "display_limit": months,
                    "export_columns": "date,total,domains_num",
                }
                logger.info(f"[SEMRUSH] Fetching backlink history for {domain} ({months} months)")
                response = requests.get(ANALYTICS_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error: {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "Unexpected response format from Semrush API",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]  # Strip whitespace
                history = []
                prev_domains = None
                prev_backlinks = None
                
                for line in lines[1:]:
                    if not line.strip():  # Skip empty lines
                        continue
                    values = [v.strip() for v in line.split(";")]  # Strip whitespace
                    data = dict(zip(headers, values))
                    
                    total_backlinks = int(data.get("total", "0") or "0")
                    referring_domains = int(data.get("domains_num", "0") or "0")
                    
                    # Calculate growth
                    domain_growth = None
                    backlink_growth = None
                    if prev_domains is not None:
                        domain_growth = referring_domains - prev_domains
                        backlink_growth = total_backlinks - prev_backlinks
                    
                    history.append({
                        "date": data.get("date", ""),
                        "total_backlinks": total_backlinks,
                        "referring_domains": referring_domains,
                        "domain_growth": domain_growth,
                        "backlink_growth": backlink_growth,
                    })
                    
                    prev_domains = referring_domains
                    prev_backlinks = total_backlinks
                
                logger.info(f"[SEMRUSH] Backlink history for {domain}: {len(history)} months analyzed")
                return {
                    "success": True,
                    "domain": domain,
                    "months_analyzed": len(history),
                    "history": history,
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching backlink history for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 10: Traffic Analytics
        # ============================================================
        def semrush_traffic_analytics(
            domain: str,
        ) -> dict:
            """Get traffic analytics data for a domain.
            
            Note: This endpoint requires Semrush Traffic Analytics subscription.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
            
            Returns:
                Dictionary with visits, unique visitors, pages per visit, bounce rate
            """
            try:
                params = {
                    "type": "traffic_summary",
                    "key": semrush_api_key,
                    "targets": domain,
                    "export_columns": "target,visits,users,pages_per_visit,avg_visit_duration,bounce_rate",
                    "display_date": "2024-01-01",  # Most recent month
                }
                logger.info(f"[SEMRUSH] Fetching traffic analytics for {domain} (requires premium subscription)")
                response = requests.get(ANALYTICS_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    # Traffic Analytics often requires premium subscription
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error (may require premium subscription): {response.status_code} - {response.text[:200]}",
                    }
                
                # Check for Semrush API errors
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    if error_result.get("no_data"):
                        return {
                            "success": False,
                            "domain": domain,
                            "error": "No traffic analytics data found (may require premium subscription)"
                        }
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "No traffic data found (may require premium subscription)",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                values = [v.strip() for v in lines[1].split(";")]
                data = dict(zip(headers, values))
                
                logger.info(f"[SEMRUSH] Traffic analytics for {domain}: {data.get('visits', 'N/A')} visits")
                return {
                    "success": True,
                    "domain": domain,
                    "monthly_visits": data.get("visits", "N/A"),
                    "unique_visitors": data.get("users", "N/A"),
                    "pages_per_visit": data.get("pages_per_visit", "N/A"),
                    "avg_visit_duration": data.get("avg_visit_duration", "N/A"),
                    "bounce_rate": data.get("bounce_rate", "N/A"),
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching traffic analytics for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # ============================================================
        # Tool 11: Traffic Sources Distribution
        # ============================================================
        def semrush_traffic_sources(
            domain: str,
        ) -> dict:
            """Get traffic sources breakdown for a domain (organic, direct, referral, social).
            
            Note: This endpoint requires Semrush Traffic Analytics subscription.
            
            Args:
                domain: The domain to analyze (e.g., 'example.com')
            
            Returns:
                Dictionary with traffic source percentages:
                - organic: SEO traffic from search engines
                - direct: Direct visits (typing URL)
                - referral: Referral traffic from other sites
                - social: Traffic from social media platforms
            """
            try:
                params = {
                    "type": "traffic_sources",
                    "key": semrush_api_key,
                    "targets": domain,
                    "export_columns": "target,organic,direct,referral,social",
                }
                logger.info(f"[SEMRUSH] Fetching traffic sources for {domain}")
                response = requests.get(ANALYTICS_URL, params=params, timeout=30)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": f"HTTP error (may require premium subscription): {response.status_code}",
                    }
                
                text = response.text.strip()
                error_result = check_semrush_error(text, domain)
                if error_result:
                    if error_result.get("no_data"):
                        return {
                            "success": False,
                            "domain": domain,
                            "error": "No traffic sources data found (may require premium subscription)"
                        }
                    return error_result
                
                lines = text.split("\n")
                if len(lines) < 2:
                    return {
                        "success": False,
                        "domain": domain,
                        "error": "No traffic sources data found (may require premium subscription)",
                    }
                
                headers = [h.strip() for h in lines[0].split(";")]
                values = [v.strip() for v in lines[1].split(";")]
                data = dict(zip(headers, values))
                
                # Convert to percentages
                organic = float(data.get("organic", 0)) * 100
                direct = float(data.get("direct", 0)) * 100
                referral = float(data.get("referral", 0)) * 100
                social = float(data.get("social", 0)) * 100
                
                logger.info(f"[SEMRUSH] Traffic sources for {domain}: organic={organic:.1f}%, direct={direct:.1f}%, referral={referral:.1f}%, social={social:.1f}%")
                return {
                    "success": True,
                    "domain": domain,
                    "traffic_sources": {
                        "organic": round(organic, 1),
                        "direct": round(direct, 1),
                        "referral": round(referral, 1),
                        "social": round(social, 1),
                    },
                    "seo_ratio": round(organic, 1),
                    "non_seo_ratio": round(100 - organic, 1),
                    "analysis": {
                        "primary_channel": max(
                            [("organic", organic), ("direct", direct), ("referral", referral), ("social", social)],
                            key=lambda x: x[1]
                        )[0],
                        "seo_dominant": organic >= 50,
                    }
                }
            except Exception as e:
                logger.error(f"[SEMRUSH] Error fetching traffic sources for {domain}: {e}")
                return {
                    "success": False,
                    "domain": domain,
                    "error": str(e),
                }
        
        # Filter tools based on enabled_tools config
        enabled = get_enabled_tools()
        tools = []
        tool_names = []
        
        if enabled.get("semrush_domain_overview", True):
            tools.append(semrush_domain_overview)
            tool_names.append("semrush_domain_overview")
        if enabled.get("semrush_domain_overview_batch", True):
            tools.append(semrush_domain_overview_batch)
            tool_names.append("semrush_domain_overview_batch")
        if enabled.get("semrush_domain_history", True):
            tools.append(semrush_domain_history)
            tool_names.append("semrush_domain_history")
        if enabled.get("semrush_domain_organic_pages", True):
            tools.append(semrush_domain_organic_pages)
            tool_names.append("semrush_domain_organic_pages")
        if enabled.get("semrush_organic_keywords", True):
            tools.append(semrush_organic_keywords)
            tool_names.append("semrush_organic_keywords")
        if enabled.get("semrush_backlinks_overview", True):
            tools.append(semrush_backlinks_overview)
            tool_names.append("semrush_backlinks_overview")
        if enabled.get("semrush_backlink_history", True):
            tools.append(semrush_backlink_history)
            tool_names.append("semrush_backlink_history")
        if enabled.get("semrush_backlinks_list", True):
            tools.append(semrush_backlinks_list)
            tool_names.append("semrush_backlinks_list")
        if enabled.get("semrush_keyword_gap", True):
            tools.append(semrush_keyword_gap)
            tool_names.append("semrush_keyword_gap")
        if enabled.get("semrush_traffic_analytics", True):
            tools.append(semrush_traffic_analytics)
            tool_names.append("semrush_traffic_analytics")
        if enabled.get("semrush_traffic_sources", True):
            tools.append(semrush_traffic_sources)
            tool_names.append("semrush_traffic_sources")
        
        if tools:
            logger.info(f"[SEMRUSH] Tools enabled: {', '.join(tool_names)}")
        else:
            logger.info("[SEMRUSH] All Semrush tools disabled by config")
        
        return tools
        
    except Exception as e:
        logger.error(f"[SEMRUSH] Error initializing tools: {e}")
        return []

