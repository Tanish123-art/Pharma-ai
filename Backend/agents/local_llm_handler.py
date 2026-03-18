import os
import httpx
from typing import Any, List, Optional
from langchain_core.language_models.llms import LLM

# ─────────────────────────────────────────────────────────────────────────────
# ARCHITECTURE:
#   Custom LLM wrapper for Cloudspaces Litng API
#   URL is read from CLOUDSPACE_API_URL in .env
#   Falls back to the bold-magenta-ynf3 studio URL (currently active)
# ─────────────────────────────────────────────────────────────────────────────

# ✅ This is the URL for the RUNNING studio: bold-magenta-ynf3
# Format: https://{studio-name}.cloudspaces.litng.ai/generate
_ACTIVE_URL = "https://8000-dep-01km0rz8s61wbqvd5b73e3r9vb-d.cloudspaces.litng.ai/generate"
_ACTIVE_KEY = "2193d5f5-1a20-4529-b51f-55302c193224"

class CloudspaceAPI_LLM(LLM):
    api_url: str = _ACTIVE_URL
    api_key: str = _ACTIVE_KEY

    @property
    def _llm_type(self) -> str:
        return "cloudspace_api_llm"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        data = {
            "prompt": prompt,
            "max_tokens": kwargs.get("max_tokens", 2048),
            "stream": False
        }

        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(self.api_url, headers=headers, json=data)
                response.raise_for_status()
                result = response.json()
                return result.get("text", "")
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            print(f"❌ [CloudspaceAPI_LLM] HTTP {status} — URL tried: {self.api_url}")
            if status == 404:
                print(f"   ⚠️  404 = wrong URL or studio is SLEEPING. Check PORTS tab in Cloudspace.")
            return f"❌ API Error: {str(e)}"
        except httpx.HTTPError as e:
            print(f"❌ [CloudspaceAPI_LLM] API Error: {e}")
            return f"❌ API Error: {str(e)}"
        except Exception as e:
            print(f"❌ [CloudspaceAPI_LLM] Unexpected Error: {e}")
            return f"❌ Unexpected Error: {str(e)}"

class LocalModelHandler:
    _llm = None
    
    @classmethod
    def get_llm(cls):
        if cls._llm is not None:
            return cls._llm

        # Override from .env if set
        api_url = os.getenv("CLOUDSPACE_API_URL", _ACTIVE_URL)
        api_key = os.getenv("CLOUDSPACE_API_KEY", _ACTIVE_KEY)

        print(f"✅ [LocalModelHandler] Connecting to Cloudspaces API...")
        print(f"   🌐 URL: {api_url}")

        # Pydantic v2 compatible: set defaults then override fields directly
        llm = CloudspaceAPI_LLM()
        llm.api_url = api_url
        llm.api_key = api_key
        cls._llm = llm
        return cls._llm

