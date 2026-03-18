import os
import requests
import json
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class WebAgent:
    def __init__(self):
        self.serper_api_key = os.getenv("SERPER_API_KEY")
        self.base_url = "https://google.serper.dev/search"

    async def search(self, query: str) -> Dict[str, Any]:
        """
        Searches the web using Serper API (Google Search) for real-time information.
        """
        if not self.serper_api_key:
            return {"web_output": {"error": "SERPER_API_KEY not found in environment variables."}}

        headers = {
            'X-API-KEY': self.serper_api_key,
            'Content-Type': 'application/json'
        }
        
        payload = json.dumps({
            "q": query,
            "num": 5  # Number of results
        })

        try:
            # We typically use httpx for async, but requests is fine if not blocking heavily. 
            # Ideally switch to httpx for true async, consistent with previous code.
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(self.base_url, headers=headers, data=payload, timeout=30.0)
                
                if response.status_code != 200:
                    return {"web_output": {"error": f"Serper API returned {response.status_code}: {response.text}"}}
                
                data = response.json()
                
                # Parse Results
                articles = []
                if "organic" in data:
                    for item in data["organic"]:
                        articles.append({
                            "title": item.get("title", ""),
                            "source": item.get("link", ""), # Mapping link to source for display
                            "snippet": item.get("snippet", ""),
                            "date": item.get("date", ""),
                            "link": item.get("link", "")
                        })
                
                # Also check for "news" or "top stories" if organic is empty? 
                # For now organic is the standard web result.
                
                return {"web_output": {"results": articles, "count": len(articles)}}
                
        except Exception as e:
            return {"web_output": {"error": f"Web Search Failed: {str(e)}"}}
