import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pinecone import Pinecone

load_dotenv()

async def clear_dbs():
    print("🧹 Starting Database Cleanup...")

    # 1. Clear MongoDB
    mongo_url = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
    db_name = os.getenv("DATABASE_NAME", "pharma_ai_db")
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        collections = await db.list_collection_names()
        for coll in collections:
            await db[coll].drop()
            print(f"✅ Dropped MongoDB collection: {coll}")
        print("✅ MongoDB cleared.")
    except Exception as e:
        print(f"❌ MongoDB cleanup failed: {e}")

    # 2. Clear Pinecone
    try:
        pc_api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX_NAME")
        if pc_api_key and index_name:
            pc = Pinecone(api_key=pc_api_key)
            index = pc.Index(index_name)
            index.delete(deleteAll=True)
            print(f"✅ Cleared all vectors from Pinecone index: {index_name}")
        else:
            print("⚠️ Skipped Pinecone cleanup: API key or Index Name not found in env.")
    except Exception as e:
        print(f"❌ Pinecone cleanup failed: {e}")

if __name__ == "__main__":
    asyncio.run(clear_dbs())
