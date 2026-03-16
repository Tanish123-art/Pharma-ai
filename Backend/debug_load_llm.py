import traceback
from agents.local_llm_handler import LocalModelHandler

try:
    print("Invoking LocalModelHandler.get_llm()...")
    llm = LocalModelHandler.get_llm()
    print("LLM loaded:", type(llm))
except Exception as e:
    print("Exception during LLM load:")
    traceback.print_exc()
    raise
