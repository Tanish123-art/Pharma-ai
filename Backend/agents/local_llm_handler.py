import os

# Heavy ML dependencies are imported lazily inside `get_llm` to avoid
# raising ImportError at module import time in environments without GPU
# frameworks installed. This lets the rest of the app run and handle the
# missing LLM gracefully.

class LocalModelHandler:
    _instance = None
    _llm = None
    
    @classmethod
    def get_llm(cls):
        if cls._llm is not None:
            return cls._llm
            
        model_path = os.path.join(os.path.dirname(__file__), "master_agent_merged")
        
        # Verify and import heavy ML dependencies lazily
        try:
            import accelerate
            import torch
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
            from langchain_huggingface import HuggingFacePipeline
            print(f"🔌 [LocalModelHandler] Accelerate version: {accelerate.__version__}")
        except ImportError as e:
            print(f"❌ [LocalModelHandler] Missing ML dependency: {e}. Install requirements: Backend/requirements.txt")
            cls._llm = None
            return None

        abs_model_path = os.path.abspath(model_path)
        print(f"🔌 Loading local model from: {abs_model_path}", flush=True)

        try:
            # Check if directory exists
            if not os.path.exists(abs_model_path):
                print(f"❌ [LocalModelHandler] Model directory NOT FOUND at: {abs_model_path}")
                parent_dir = os.path.dirname(abs_model_path)
                if os.path.exists(parent_dir):
                    print(f"   Contents of {parent_dir}: {os.listdir(parent_dir)}")
                raise FileNotFoundError(f"Model directory not found at {abs_model_path}")

            # Load Tokenizer & Model
            try:
                print("   Loading tokenizer...", flush=True)
                tokenizer = AutoTokenizer.from_pretrained(abs_model_path)

                print("   Loading model (this may take a moment)...", flush=True)
                model = AutoModelForCausalLM.from_pretrained(
                    abs_model_path,
                    device_map="auto",
                    offload_folder="offload",
                    torch_dtype=torch.float16 if torch.cuda.is_available() else None,
                    low_cpu_mem_usage=True
                )


                # Create Pipeline
                # Fix for potential device-side asserts (Vocabulary Mismatch)
                if len(tokenizer) > model.get_input_embeddings().weight.shape[0]:
                    print(f"⚠️ Resizing model embeddings from {model.get_input_embeddings().weight.shape[0]} to {len(tokenizer)}")
                    model.resize_token_embeddings(len(tokenizer))
                
                # Ensure pad token is set
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token
                    model.config.pad_token_id = tokenizer.eos_token_id
                    
                pipe = pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    max_new_tokens=1024,
                    temperature=0.1,
                    top_p=0.95,
                    repetition_penalty=1.15,
                    do_sample=True,
                    return_full_text=False,
                )

                # Wrap in LangChain
                cls._llm = HuggingFacePipeline(pipeline=pipe)
                print(f"✅ Local model loaded successfully!", flush=True)
                return cls._llm
            except Exception as inner_e:
                print(f"❌ Failed to load local model from {model_path}: {inner_e}")
                import traceback
                traceback.print_exc()
                cls._llm = None
                return None
        except Exception as e:
            print(f"❌ Failed to initialize local model handler: {e}")
            import traceback
            traceback.print_exc()
            cls._llm = None
            return None

