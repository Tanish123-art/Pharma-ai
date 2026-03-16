from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

BASE_MODEL_PATH = "models/master_agent_merged"
LORA_PATH = "models/master_agent_lora_v1"
MERGED_SAVE_PATH = "models/master_agent_final"

print(f"Loading base model from {BASE_MODEL_PATH}...")
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_PATH,
    device_map="auto",
    torch_dtype=torch.float16,
    trust_remote_code=True
)

print(f"Loading LoRA adapter from {LORA_PATH}...")
model = PeftModel.from_pretrained(base_model, LORA_PATH)

# 🔗 Merge LoRA into base
print("Merging model...")
model = model.merge_and_unload()

# 💾 Save full model
print(f"Saving merged model to {MERGED_SAVE_PATH}...")
model.save_pretrained(MERGED_SAVE_PATH)

# Load and save tokenizer (was missing before)
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_PATH, trust_remote_code=True)
tokenizer.save_pretrained(MERGED_SAVE_PATH)

print(f"✅ Fully merged model saved to {MERGED_SAVE_PATH}")