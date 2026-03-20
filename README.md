<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/LangGraph-FF6F00?style=for-the-badge&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/Pinecone-00A98F?style=for-the-badge&logo=pinecone&logoColor=white" />
</p>

# 🧬 PharmaAI — Agentic AI Platform for Drug Discovery & Repurposing

> **A multi-agent AI system that orchestrates 8 specialized agents to transform complex pharmaceutical queries into actionable market intelligence, clinical insights, and strategic research — in minutes, not months.**

---

## 📌 Table of Contents

- [Vision](#-vision)
- [Agent Architecture](#-agent-architecture-1-master--7-workers)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Vision

PharmaAI is a **next-generation agentic research platform** built to accelerate pharmaceutical portfolio planning. It enables planners, analysts, and decision-makers to ask complex strategic questions — such as *"Which respiratory diseases show low competition but high patient burden in India?"* — and receive comprehensive, multi-source answers synthesized from market data, clinical trials, patents, trade flows, internal documents, and the web.

The platform uses a **RAG-First strategy**: every query first searches the user's uploaded documents for an instant answer. If the internal data is insufficient, the **Master Agent** decomposes the query and dispatches **7 specialized Worker Agents** in parallel, then synthesizes all findings into a polished response with tables, charts, and downloadable PDF reports.

---

## 🤖 Agent Architecture (1 Master + 7 Workers)

### 🧠 1. Master Agent — Conversation Orchestrator
The central intelligence that drives the entire research pipeline.

- Interprets user queries and breaks them into modular research tasks
- Delegates tasks to domain-specific Worker Agents via LangGraph
- Synthesizes responses from all Workers into coherent summaries with references
- Responds with formatted text, tables, charts, or PDF reports as needed

### 🔧 2. Worker Agents

| # | Agent | Responsibility | Output |
|---|---|---|---|
| a | **📊 IQVIA Insights Agent** | Queries IQVIA datasets for sales trends, volume shifts, and therapy area dynamics | Market size tables, CAGR trends, therapy-level competition summaries |
| b | **🌍 EXIM Trends Agent** | Extracts export-import data for APIs/formulations across countries | Trade volume charts, sourcing insights, import dependency tables |
| c | **📜 Patent Landscape Agent** | Searches USPTO and IP databases for active patents, expiry timelines, and FTO flags | Patent status tables, competitive filing heatmaps, PDF extracts |
| d | **🏥 Clinical Trials Agent** | Fetches trial pipeline data from ClinicalTrials.gov and WHO ICTRP | Active trial tables, sponsor profiles, trial phase distributions |
| e | **📂 Internal Knowledge Agent** | Retrieves and summarizes user-uploaded internal documents (MINS, strategy decks, field insights) via RAG | Key takeaways, comparative tables, downloadable briefing PDFs |
| f | **🌐 Web Intelligence Agent** | Performs real-time web search for guidelines, scientific publications, news, and patient forums | Hyperlinked summaries, quotations from credible sources, guideline extracts |
| g | **📄 Report Generator Agent** | Formats the synthesized response into a polished PDF or Excel report | PDF summaries with charts/tables, downloadable links in-chat |

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **🧠 Hybrid Intelligence Engine** | Combines semantic document search (RAG) with real-time multi-agent research for comprehensive answers |
| **🤖 LangGraph Orchestration** | Stateful multi-agent workflow with parallel execution, validation, and synthesis |
| **📂 Document Upload & RAG** | Upload PDFs — they are chunked, embedded (BGE-M3), and indexed in Pinecone for instant semantic retrieval |
| **📄 One-Click PDF Reports** | Auto-generates professional research dossiers with findings from all agents |
| **💬 Conversational Follow-Up** | Continue chatting within a research session to refine findings without re-running agents |
| **🔒 Authentication & Audit Trail** | JWT-based auth with full compliance audit logging for every agent execution |
| **📡 Real-Time Progress** | WebSocket-based live updates showing which agents are running, completed, or failed |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TS)                    │
│   Dashboard │ Chat │ Upload │ Reports │ Notifications │ History │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST + WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                        FastAPI Backend                          │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐    │
│  │  /ask (RAG)  │───▶│  Internal Knowledge Agent (RAG)     │    │
│  │  Endpoint    │    │  Pinecone Vector Search              │    │
│  │             │    │  Session-scoped → Global fallback     │    │
│  └──────┬──────┘    └──────────────────────────────────────┘    │
│         │ RAG Miss / Insufficient                               │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │         🧠 Master Agent (LangGraph Orchestrator)         │    │
│  │                                                          │    │
│  │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────┐ ┌───────┐  │    │
│  │  │  Web   │ │Clinical │ │Patent  │ │IQVIA │ │ EXIM  │  │    │
│  │  │ Agent  │ │ Agent   │ │Agent   │ │Agent │ │Agent  │  │    │
│  │  └────┬───┘ └────┬────┘ └───┬────┘ └──┬───┘ └──┬────┘  │    │
│  │       └──────────┼──────────┼─────────┼────────┘        │    │
│  │            ┌─────▼──────────▼─────────▼──────┐          │    │
│  │            │   Master Agent (Synthesis)       │          │    │
│  │            │   Validates + Consolidates       │          │    │
│  │            └──────────────┬───────────────────┘          │    │
│  │                     ┌─────▼─────┐                        │    │
│  │                     │  Report   │                        │    │
│  │                     │Generator  │                        │    │
│  │                     │  Agent    │                        │    │
│  │                     └───────────┘                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   MongoDB     │  │   Pinecone   │  │  JWT Auth Module   │    │
│  │ Sessions/Logs │  │  Embeddings  │  │  User Management   │    │
│  └───────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### RAG-First Strategy

1. **Search** — Every query first hits the **Internal Knowledge Agent**, performing semantic similarity search against user-uploaded documents in Pinecone.
2. **Hit** — If relevant chunks score above the similarity threshold (≥ 0.45), the LLM answers instantly using document context.
3. **Miss** — If RAG data is insufficient, the **Master Agent** decomposes the query and dispatches the optimal combination of Worker Agents in parallel.
4. **Synthesis** — The Master Agent validates, consolidates, and synthesizes all agent findings into a unified response.
5. **Report** — The Report Generator Agent formats the final output into a downloadable PDF with charts, tables, and references.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Recharts, Mermaid |
| **Backend** | FastAPI (Python), Uvicorn |
| **Agent Framework** | LangChain, LangGraph (stateful multi-agent orchestration) |
| **LLM** | Qwen-2.5-Coder via Lightning Studio / vLLM, Google Gemini (fallback) |
| **Embeddings** | BGE-M3 (local) via HuggingFace |
| **Vector Database** | Pinecone (semantic document indexing & retrieval) |
| **Database** | MongoDB (session management, audit trails, reports) |
| **Authentication** | JWT (JSON Web Tokens) with bcrypt password hashing |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Python | Required |
| Node.js | 18+ |
| MongoDB | 6.0+ (local or Atlas) |
| Pinecone | API key required |

### 1. Clone the Repository

```bash
git clone https://github.com/Tanish123-art/Pharma-ai.git
cd Pharma-ai
```

### 2. Backend Setup

```bash
cd Backend
python -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# MongoDB
MONGO_URL=mongodb://127.0.0.1:27017
DATABASE_NAME=pharma_ai_db

# Authentication
JWT_SECRET_KEY=<your-secret-key>

# Pinecone (Vector Database for RAG)
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_HOST=<your-pinecone-host-url>
PINECONE_INDEX_NAME=<your-index-name>

# Google Gemini (fallback LLM)
GOOGLE_API_KEY=<your-google-api-key>

# Web Search
SERPER_API_KEY=<your-serper-api-key>

# SMTP (Notifications)
smtp_mail=<your-email>
smtp_password=<your-app-password>
```

### 4. Start the Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:8000/docs` (API docs).

---

## 📁 Project Structure

```
Pharma-ai/
├── Backend/
│   ├── agents/
│   │   ├── orchestrator.py              # LangGraph multi-agent workflow
│   │   ├── master_agent.py              # Master Agent — synthesis & validation
│   │   ├── web_agent.py                 # Web Intelligence Agent
│   │   ├── clinical_agent.py            # Clinical Trials Agent
│   │   ├── patent_agent.py              # Patent Landscape Agent
│   │   ├── iqvia_agent.py               # IQVIA Insights Agent
│   │   ├── exim_agent.py                # EXIM Trends Agent
│   │   ├── report_agent.py              # Report Generator Agent
│   │   ├── router.py                    # /research API + Internal Knowledge Agent (RAG)
│   │   ├── chat_router.py               # /chat follow-up endpoints
│   │   ├── documents_router.py          # /documents upload & indexing
│   │   ├── reports_router.py            # Reports API
│   │   ├── research_service.py          # MongoDB session management
│   │   ├── models.py                    # Pydantic data models
│   │   ├── state.py                     # LangGraph state definition
│   │   ├── local_llm_handler.py         # Cloudspaces / vLLM LLM wrapper
│   │   └── local_embedding_handler.py   # BGE-M3 embedding handler
│   ├── auth/                            # Authentication module (JWT + bcrypt)
│   ├── main.py                          # FastAPI application entry point
│   ├── requirements.txt                 # Python dependencies
│   └── .env                             # Environment configuration
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx             # Main dashboard view
│   │   │   ├── ResearchInterface.tsx     # Research query & results UI
│   │   │   ├── ChatBot.tsx               # Conversational follow-up chat
│   │   │   ├── Sidebar.tsx               # Navigation & session history
│   │   │   ├── UploadModal.tsx           # Document upload modal
│   │   │   ├── ReportGenerator.tsx       # PDF report download UI
│   │   │   ├── ResultsVisualization.tsx  # Charts & data visualization
│   │   │   └── Auth.tsx                  # Login & registration
│   │   ├── contexts/                     # React context providers
│   │   ├── lib/                          # API client & utilities
│   │   └── App.tsx                       # Root application component
│   ├── package.json
│   └── vite.config.ts
├── reports/                              # Generated PDF reports
└── README.md
```

---

## 🔗 API Endpoints

### Research

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/research/ask` | Smart RAG-first query — Internal Knowledge Agent + fallback to full orchestration |
| `POST` | `/research/start` | Start full multi-agent research workflow |
| `GET` | `/research/sessions` | List user's research history |
| `GET` | `/research/sessions/{id}` | Get session details & findings |
| `DELETE` | `/research/sessions/{id}` | Delete a research session |
| `WS` | `/research/ws/{id}` | Real-time agent progress via WebSocket |
| `GET` | `/research/reports/{id}/download` | Download generated PDF report |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload & index a document for RAG |
| `GET` | `/documents/list` | List uploaded documents |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Authenticate & receive JWT token |
| `GET` | `/auth/me` | Get current user profile |

---

## 🧪 Sample Queries

The platform is designed to handle strategic pharmaceutical planning questions such as:

- *"Which respiratory diseases show low competition but high patient burden in India?"*
- *"What are the patent expiry timelines for top-selling biologics in oncology?"*
- *"Show me the clinical trial pipeline for GLP-1 receptor agonists in Phase III."*
- *"Compare import/export trends for Metformin API across India, China, and EU."*
- *"Summarize the key findings from our internal strategy deck on rare diseases."*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ by <strong>Team Pharma Innovators</strong>
</p>
