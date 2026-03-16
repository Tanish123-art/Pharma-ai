import requests
from typing import Dict, Any

class ClinicalAgent:
    def __init__(self):
        self.base_url = "https://clinicaltrials.gov/api/v2/studies"

    async def search_trials(self, query: str) -> Dict[str, Any]:
        """
        Searches ClinicalTrials.gov for trials.
        """
        params = {
            "query.term": query,
            "filter.overallStatus": "RECRUITING,ACTIVE",
            "pageSize": 10,
            "fields": "NCTId,BriefTitle,Phase,OverallStatus,SponsorName",
            "format": "json"
        }
        
        try:
            import httpx
            from json import JSONDecodeError
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=30.0)
                # Check format
                if "application/json" not in response.headers.get("content-type", ""):
                    # Likely HTML error page
                    return {"clinical_output": {"error": f"API returned non-JSON: {response.text[:200]}..."}}
                
                try:
                    data = response.json()
                    return {"clinical_output": data}
                except JSONDecodeError:
                     return {"clinical_output": {"error": "Failed to parse API JSON response"}}
        except Exception as e:
            return {"clinical_output": {"error": str(e)}}
