import requests
from typing import Dict, Any
import json
import re

class PatentAgent:
    def __init__(self):
        # Using Google Patents - free, global coverage, no authentication needed
        self.search_url = "https://patents.google.com/"

    async def search_patents(self, query: str) -> Dict[str, Any]:
        """
        Searches Google Patents for patents related to the query.
        Provides global coverage across USPTO, EPO, WIPO, and other patent offices.
        """
        # Parse query for simple search term
        search_term = query.split(":")[1].strip() if ":" in query else query
        
        # Use Serper API (already have key) for patent search - more reliable
        import os
        serper_key = os.getenv("SERPER_API_KEY")
        
        if serper_key:
            # Use Serper to search Google Patents
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://google.serper.dev/patents",
                        headers={
                            "X-API-KEY": serper_key,
                            "Content-Type": "application/json"
                        },
                        json={"q": search_term},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        patents = data.get("patents", [])[:5]  # Limit to 5
                        
                        formatted_patents = []
                        for patent in patents:
                            formatted_patents.append({
                                "title": patent.get("title", "N/A"),
                                "patent_number": patent.get("patentNumber", "N/A"),
                                "filing_date": patent.get("filingDate", "N/A"),
                                "assignee": patent.get("assignee", "N/A"),
                                "snippet": patent.get("snippet", "")[:200],
                                "url": patent.get("link", "N/A")
                            })
                        
                        return {
                            "patent_output": {
                                "count": len(formatted_patents),
                                "patents": formatted_patents,
                                "search_term": search_term,
                                "source": "Google Patents via Serper"
                            }
                        }
                    else:
                        # Fallback to mock data if Serper fails
                        return self._get_mock_patents(search_term)
                        
            except Exception as e:
                # Fallback to mock data on error
                return self._get_mock_patents(search_term)
        else:
            # No Serper key, use mock data
            return self._get_mock_patents(search_term)
    
    def _get_mock_patents(self, search_term: str) -> Dict[str, Any]:
        """
        Returns mock patent data for demo purposes when API is unavailable
        """
        mock_patents = [
            {
                "title": f"Pharmaceutical composition comprising {search_term}",
                "patent_number": "US10123456B2",
                "filing_date": "2020-01-15",
                "assignee": "Pharmaceutical Research Corp",
                "snippet": f"A pharmaceutical composition for treating diseases using {search_term} as an active ingredient...",
                "url": "https://patents.google.com/patent/US10123456B2"
            },
            {
                "title": f"Method of synthesizing {search_term} derivatives",
                "patent_number": "US9876543B1",
                "filing_date": "2019-06-20",
                "assignee": "BioPharma Solutions Inc",
                "snippet": f"Novel synthesis method for producing {search_term} derivatives with improved efficacy...",
                "url": "https://patents.google.com/patent/US9876543B1"
            }
        ]
        
        return {
            "patent_output": {
                "count": len(mock_patents),
                "patents": mock_patents,
                "search_term": search_term,
                "source": "Mock Data (Demo Mode)"
            }
        }

