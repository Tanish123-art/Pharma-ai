import os
from langchain_huggingface import HuggingFaceEmbeddings

class LocalEmbeddingHandler:
    _instance = None
    _embeddings = None
    
    @classmethod
    def get_embeddings(cls):
        if cls._embeddings is not None:
            return cls._embeddings
            
        print("🔌 [LocalEmbeddingHandler] Loading BGE-M3 embeddings model...", flush=True)
        try:
            # BGE-M3 is supported by HuggingFaceEmbeddings
            cls._embeddings = HuggingFaceEmbeddings(
                model_name="BAAI/bge-m3",
                model_kwargs={'device': 'cuda' if cls._has_cuda() else 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            print("✅ [LocalEmbeddingHandler] BGE-M3 Loaded.")
            return cls._embeddings
        except Exception as e:
            print(f"❌ [LocalEmbeddingHandler] Failed to load BGE-M3: {e}")
            # Fallback to a smaller model if BGE-M3 is too heavy or fails
            try:
                print("⚠️ [LocalEmbeddingHandler] Falling back to bge-small-en-v1.5...")
                cls._embeddings = HuggingFaceEmbeddings(
                    model_name="BAAI/bge-small-en-v1.5",
                    model_kwargs={'device': 'cpu'}
                )
                return cls._embeddings
            except Exception as fallback_e:
                print(f"❌ [LocalEmbeddingHandler] Fallback failed: {fallback_e}")
                return None

    @staticmethod
    def _has_cuda():
        try:
            import torch
            return torch.cuda.is_available()
        except:
            return False
