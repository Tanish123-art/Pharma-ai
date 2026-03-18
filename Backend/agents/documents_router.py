import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from auth.dependencies import get_current_user
from auth.models import UserInDB
from .local_embedding_handler import LocalEmbeddingHandler
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
import shutil

router = APIRouter(prefix="/documents", tags=["documents"])

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    session_id: str = None,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """Upload and ingest a document into the RAG system."""
    
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    
    # Save file locally
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Process and ingest
    try:
        # 1. Load document
        if file_ext == ".pdf":
            loader = PyPDFLoader(temp_path)
        elif file_ext in [".txt", ".md"]:
            loader = TextLoader(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, TXT, or MD.")
        
        documents = loader.load()
        
        # 2. Advanced Semantic Chunking
        print(f"📥 [Documents] Initializing SemanticChunker...")
        from langchain_experimental.text_splitter import SemanticChunker
        from agents.local_embedding_handler import LocalEmbeddingHandler
        
        embeddings = LocalEmbeddingHandler.get_embeddings()
        if not embeddings:
            raise HTTPException(status_code=500, detail="Local Embeddings not ready.")
            
        text_splitter = SemanticChunker(embeddings)
        print(f"✂️  [Documents] Running semantic division on the document (this may take a few moments)...")
        chunks = text_splitter.split_documents(documents)
        print(f"✅ [Documents] Split into {len(chunks)} semantic chunks.")
        
        # 3. Add metadata
        for chunk in chunks:
            chunk.metadata.update({
                "user_id": current_user.id,
                "session_id": session_id if session_id else "global",
                "file_name": file.filename,
                "file_id": file_id
            })
            
        # 4. Ingest into Pinecone
        embeddings = LocalEmbeddingHandler.get_embeddings()
        index_name = os.getenv("PINECONE_INDEX_NAME", "thedefenders")
        api_key = os.getenv("PINECONE_API_KEY")
        
        if not api_key:
             raise HTTPException(status_code=500, detail="PINECONE_API_KEY not configured on server.")

        if embeddings is None:
            raise HTTPException(
                status_code=500,
                detail="Embedding model failed to load. Please ensure 'sentence-transformers' is installed in the venv: venv\\Scripts\\pip install sentence-transformers"
            )

        print(f"🌲 Ingesting {len(chunks)} chunks from '{file.filename}' into index '{index_name}'...")
        
        vector_store = PineconeVectorStore.from_documents(
            chunks,
            embeddings,
            index_name=index_name,
            pinecone_api_key=api_key
        )
        
        return {
            "message": "Document ingested successfully",
            "file_id": file_id,
            "filename": file.filename,
            "chunks": len(chunks)
        }
        
    except Exception as e:
        print(f"❌ Ingestion Error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
