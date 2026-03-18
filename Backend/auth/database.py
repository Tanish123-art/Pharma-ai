from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
import ssl
from dotenv import load_dotenv

# CRITICAL FIX for Python 3.12 + OpenSSL 3.x compatibility with MongoDB Atlas
# This resolves TLSV1_ALERT_INTERNAL_ERROR by lowering the cipher security level
# Must be set BEFORE any SSL connections are attempted
os.environ['OPENSSL_CONF'] = ''  # Disable system OpenSSL config
# Alternative: create a custom opensslconfig but overriding to empty is simpler

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Validate environment variables
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set. Please check your .env file.")
if not DATABASE_NAME:
    raise ValueError("DATABASE_NAME environment variable is not set. Please check your .env file.")

# Create SSL context to fix TLSV1_ALERT_INTERNAL_ERROR on Python 3.12
def create_ssl_context():
    """
    Creates an SSL context compatible with MongoDB Atlas and Python 3.12.
    This fixes the TLSV1_ALERT_INTERNAL_ERROR by using specific SSL settings.
    """
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    ssl_context.check_hostname = True
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    
    # Set minimum TLS version to TLS 1.2 (MongoDB Atlas requires at least TLS 1.2)
    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
    
    # Allow broader cipher suite compatibility
    # This helps with Python 3.12 OpenSSL compatibility issues
    try:
        ssl_context.set_ciphers('DEFAULT@SECLEVEL=1')
    except:
        # Fallback if the cipher string is not supported
        pass
    
    return ssl_context

client = None
db = None
users_collection = None
sessions_collection = None
molecules_collection = None
notifications_collection = None
reports_collection = None

def is_connected() -> bool:
    """Check if database is connected"""
    return client is not None and users_collection is not None

async def connect_to_mongodb():
    global client, db, users_collection, sessions_collection, molecules_collection, notifications_collection, reports_collection
    try:
        # Reset connection state if reconnecting
        if client:
            try:
                client.close()
            except:
                pass
        client = None
        db = None
        users_collection = None
        sessions_collection = None
        molecules_collection = None
        notifications_collection = None
        reports_collection = None
        
        # Modify connection URL to add TLS parameters if not present
        mongo_url = MONGO_URL
        if not mongo_url:
            raise ValueError("MONGO_URL is not set. Please check your .env file.")

        is_local = "localhost" in mongo_url or "127.0.0.1" in mongo_url
        
        # Handle TLS parameters for mongodb+srv connections
        if 'mongodb+srv://' in mongo_url:
            # For SRV connections, TLS is required by default
            if '?' in mongo_url:
                if 'tls=' not in mongo_url.lower() and 'ssl=' not in mongo_url.lower():
                    mongo_url += '&tls=true'
            else:
                mongo_url += '?tls=true'
        elif 'mongodb://' in mongo_url and not is_local:
            # For standard remote connections, add TLS if not present. 
            # Skip for local connections to avoid SSL handshake errors.
            if '?' in mongo_url:
                if 'tls=' not in mongo_url.lower() and 'ssl=' not in mongo_url.lower():
                    mongo_url += '&tls=true'
            else:
                mongo_url += '?tls=true'
        
        print(f"Connecting to MongoDB...")
        print(f"Database: {DATABASE_NAME}")
        
        # Create client with appropriate settings
        if 'mongodb+srv://' in mongo_url:
            # For Atlas SRV connections
            client = AsyncIOMotorClient(
                mongo_url,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True,  # For debugging - remove in production
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
            )
        else:
            # For local or standard connections
            client = AsyncIOMotorClient(
                mongo_url,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
            )
        
        # Initialize database and collections
        db = client[DATABASE_NAME]
        users_collection = db["users"]
        sessions_collection = db["sessions"]
        molecules_collection = db["molecules"]
        notifications_collection = db["notifications"]
        reports_collection = db["reports"]
        
        # Verify connection with ping
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")

        # Check if database exists (optional warnings)
        try:
            existing_dbs = await client.list_database_names()
            if DATABASE_NAME not in existing_dbs:
                print(f"⚠️ Warning: Database '{DATABASE_NAME}' does not exist yet. It will be created on first write.")
            else:
                print(f"✅ Database '{DATABASE_NAME}' exists.")
        except Exception as e:
            print(f"⚠️ Could not list databases (non-critical): {e}")
             
        # Create indexes
        await users_collection.create_index("email", unique=True)
        print("✅ MongoDB connection established and indexed. Database: {DATABASE_NAME}")
        return True
    except Exception as e:
        print(f"❌ ERROR: Could not connect to MongoDB: {e}")
        print(f"   MONGO_URL: {MONGO_URL[:50]}..." if MONGO_URL and len(MONGO_URL) > 50 else f"   MONGO_URL: {MONGO_URL}")
        print(f"   DATABASE_NAME: {DATABASE_NAME}")
        # Reset connection state on failure
        client = None
        db = None
        users_collection = None
        sessions_collection = None
        molecules_collection = None
        notifications_collection = None
        reports_collection = None
        raise e

async def close_mongodb_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
