#!/usr/bin/env bash
# =============================================================================
# start_vllm.sh — Run Qwen2.5-3B-Instruct with vLLM inside WSL
# =============================================================================
# Run this INSIDE WSL:   bash /mnt/e/Pharma-ai2/Backend/start_vllm.sh
# =============================================================================

MODEL="Qwen/Qwen2.5-3B-Instruct"
PORT=8001

# Optional: if model already downloaded locally on Windows, 
# use the Windows path via WSL mount (faster — no re-download)
WIN_MODEL_PATH="/mnt/e/Pharma-ai2/Backend/agents/new_master"

echo "======================================================"
echo "  🚀  PharmaAI — vLLM Server"
echo "  Model : $MODEL"
echo "  Port  : $PORT"
echo "======================================================"

# ── Install vLLM if not present ───────────────────────────────────────────────
if ! python3 -c "import vllm" 2>/dev/null; then
    echo "📦 Installing vllm..."
    pip install vllm --quiet
fi

# Install langchain_openai on WINDOWS side (if not already):
# (run this once in the Windows venv terminal)
# venv\Scripts\pip install langchain-openai httpx

# ── Determine model source ────────────────────────────────────────────────────
if [ -d "$WIN_MODEL_PATH" ] && [ "$(ls -A $WIN_MODEL_PATH)" ]; then
    echo "✅ Using locally downloaded model: $WIN_MODEL_PATH"
    MODEL_SRC="$WIN_MODEL_PATH"
else
    echo "⚠️  Local model not found at $WIN_MODEL_PATH"
    echo "   Will download from HuggingFace (first run may take a while)..."
    MODEL_SRC="$MODEL"
fi

# ── Launch vLLM ───────────────────────────────────────────────────────────────
echo ""
echo "🔥 Starting vLLM server on port $PORT ..."
echo "   FastAPI backend will auto-connect to http://localhost:$PORT/v1"
echo ""

python3 -m vllm.entrypoints.openai.api_server \
    --model "$MODEL_SRC" \
    --port $PORT \
    --host 0.0.0.0 \
    --dtype auto \
    --max-model-len 4096 \
    --gpu-memory-utilization 0.85
