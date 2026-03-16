import os
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from .local_llm_handler import LocalModelHandler
from langchain_pinecone import PineconeVectorStore
from threading import Lock
from langchain_core.messages import SystemMessage, HumanMessage
from pinecone import Pinecone

class InternalAgent:
    def __init__(self):
        self.assets_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "assets")
        self.vector_store = None
        # Use Local Model
        try:
            self.llm = LocalModelHandler.get_llm()
            print("🤖 Internal Agent: Connected to Local Model")
        except Exception as e:
            error_msg = f"⚠️ Internal Agent: Failed to load local model: {e}"
            print(error_msg)
            with open("debug_llm_load.log", "a", encoding="utf-8") as f:
                f.write(f"{error_msg}\n")
            self.llm = None
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.index_name = os.getenv("PINECONE_INDEX_NAME")
        if not self.index_name:
             # Fallback or error, let's err for safety or use a default
             self.index_name = "pharma-research-index"
        
        self.init_lock = Lock()
        self.initialized = False

    async def _initialize_index(self):
        """
        Initializes Pinecone index.
        Checks if documents already exist in the index (naive check) or just loads the store.
        If assets dir has files, we might want to upsert them.
        For valid RAG, we assume the index is the source of truth.
        """
        if self.initialized:
            return

        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            print("❌ InternalAgent: PINECONE_API_KEY missing.")
            return

        try:
            # Initialize connection to Pinecone
            print(f"🌲 InternalAgent: Connecting to Pinecone Index '{self.index_name}'...")
            
            # We don't need to rebuild from PDF every time if it's already in Pinecone.
            # But we should check if we need to ingest new files.
            # For this focused implementation, we will LOAD the existing index for querying,
            # and only ingest if strictly requested or empty. 
            # Let's assume we want to ingest what's in 'assets' if the index is empty?
            # Or simpler: Just Connect.
            
            self.vector_store = PineconeVectorStore(
                index_name=self.index_name,
                embedding=self.embeddings,
                pinecone_api_key=api_key
            )
            
            # Optional: Ingest if assets present and we want to auto-update.
            # Real production would track processed files.
            # Here, we will just connect. One-time ingestion script is better, 
            # but user asked 'makesure all things comefrom .env'.
            
            # Simple check/ingest logic:
            if os.path.exists(self.assets_path) and os.listdir(self.assets_path):
                 # We could ingest here. logic is similar to FAISS but specific to Pinecone upsert.
                 pass
            
            self.initialized = True
            print("✅ InternalAgent: Pinecone Connected.")
            
        except Exception as e:
            print(f"❌ InternalAgent: Error connecting to Pinecone: {e}")

    async def query_internal_knowledge(self, query: str) -> dict:
        if not self.vector_store:
            await self._initialize_index()
            
        if not self.vector_store:
             return {"internal_output": "Vector DB not available (Pinecone Connection Failed)."}

        if not self.llm:
             return {"internal_output": "LLM not available (Local Model failed to load)."}

        try:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
            relevant_docs = await retriever.ainvoke(query)
            
            if not relevant_docs:
                 return {"internal_output": "No relevant internal documents found in Vector DB."}

            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Optimized concise prompt
            prompt = f"""Internal Knowledge Agent: Answer using ONLY the context below.

Context:
{context}

Query: {query}

If context lacks info, state clearly."""
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return {"internal_output": response.content}
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                 return {"internal_output": "Internal knowledge temporarily unavailable (Quota Limit Reached)."}
            return {"internal_output": f"Error querying Vector DB: {error_str[:150]}..."}
