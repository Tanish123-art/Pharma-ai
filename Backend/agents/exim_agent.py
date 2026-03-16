from typing import Dict, Any
import os

class EXIMAgent:
    def __init__(self):
        # Using UN Comtrade API - free, global trade data
        self.base_url = "https://comtradeapi.un.org/data/v1/get/C/A/HS"
        # HS Code 3004: Medicaments (pharmaceutical products)
        self.pharma_hs_code = "3004"

    async def analyze(self, query: str) -> dict:
        """
        Analyzes export/import data for pharmaceutical products using UN Comtrade.
        Provides real trade statistics across countries.
        """
        # Parse query for drug/compound name
        search_term = query.split(":")[1].strip() if ":" in query else query
        
        try:
            import httpx
            
            # Get recent trade data for pharmaceutical products
            # Query last year's data for major pharma exporters
            params = {
                "cmdCode": self.pharma_hs_code,  # Pharmaceutical products
                "flowCode": "X",  # Exports
                "partnerCode": "0",  # World (all partners)
                "period": "2023",  # Recent year
                "reporterCode": "156,699,276,380,842",  # China, India, Germany, Italy, USA
                "format": "json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Parse and format trade data
                    trade_data = data.get("data", [])
                    
                    if trade_data:
                        # Aggregate by country
                        country_exports = {}
                        for record in trade_data[:20]:  # Limit processing
                            reporter = record.get("reporterDesc", "Unknown")
                            value = record.get("primaryValue", 0)
                            
                            if reporter not in country_exports:
                                country_exports[reporter] = 0
                            country_exports[reporter] += value
                        
                        # Sort by export value
                        sorted_countries = sorted(
                            country_exports.items(), 
                            key=lambda x: x[1], 
                            reverse=True
                        )
                        
                        # Format output
                        output = self._format_trade_analysis(
                            search_term, 
                            sorted_countries,
                            "UN Comtrade"
                        )
                        return {"exim_output": output}
                    else:
                        # No data, use fallback
                        return self._get_mock_trade_data(search_term)
                else:
                    # API error, use fallback
                    return self._get_mock_trade_data(search_term)
                    
        except Exception as e:
            # Error, use fallback
            return self._get_mock_trade_data(search_term)
    
    def _format_trade_analysis(self, drug: str, countries: list, source: str) -> str:
        """Format trade data into readable analysis"""
        
        top_exporters = countries[:3] if len(countries) >= 3 else countries
        
        analysis = f"""**EXIM INTELLIGENCE: {drug}**

**Sourcing Hubs:**
"""
        for i, (country, value) in enumerate(top_exporters, 1):
            value_billions = value / 1_000_000_000
            analysis += f"- {country}: ${value_billions:.2f}B in pharmaceutical exports\n"
        
        analysis += f"""
**12-18M Trends:**
- Volume: Stable to increasing based on global pharmaceutical demand
- Price: Moderate fluctuation due to API supply chain dynamics

**Top Risk:** Supply concentration in top 3 countries (India, China, Germany)

**Recommendation:** Diversify sourcing across multiple regions to mitigate supply chain risks

**Data Source:** {source} (HS Code 3004 - Medicaments)
"""
        return analysis
    
    def _get_mock_trade_data(self, drug: str) -> dict:
        """Returns mock trade data for demo purposes"""
        
        mock_analysis = f"""**EXIM INTELLIGENCE: {drug}**

**Sourcing Hubs:**
- India: $24.5B in pharmaceutical exports (~40% global API production)
- China: $18.2B in pharmaceutical exports (~30% active ingredients)
- Germany: $12.8B in pharmaceutical exports (high-value formulations)

**12-18M Trends:**
- Volume: Increasing 8-12% YoY driven by generic drug demand
- Price: Stable with slight upward pressure on specialty APIs

**Top Risk:** Concentration risk - 70% of global API production in India/China

**Recommendation:** Establish dual-source strategy with European backup suppliers

**Data Source:** Mock Data (Demo Mode) - Based on typical pharma trade patterns
"""
        return {"exim_output": mock_analysis}


