# Agent101 - AI Agent Platform with PDF Extraction

Create AI agents that understand your documents! Upload PDFs, ask questions, get accurate answers powered by Llama models.

## 🚀 Quick Start

See **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes!

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[PDF_EXTRACTION_GUIDE.md](PDF_EXTRACTION_GUIDE.md)** - Complete PDF extraction guide with examples
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Full platform documentation

## ✨ Features

- 🤖 Create custom AI agents
- 📄 Upload PDFs (text-based or scanned)
- 💬 Chat with agents about your documents
- 🔍 Intelligent RAG (Retrieval Augmented Generation)
- ⚡ Ultra-fast Llama 3.3 70B responses via Cerebras
- 🔒 Secure multi-tenant architecture

## 🎯 Perfect For

- Customer Support FAQs
- Technical Documentation
- Product Manuals
- Training Materials
- Knowledge Bases

## 📦 Stack

- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Cerebras Llama 3.3 70B
- **PDF**: pdf-parse + LlamaParse (optional)

## 🔧 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

3. **Deploy edge functions:**
   ```powershell
   .\deploy-pdf-extraction.ps1
   ```

4. **Run:**
   ```bash
   npm run dev
   ```

See [QUICK_START.md](QUICK_START.md) for detailed instructions!

## 📖 Example Usage

1. Create agent: "FAQ Bot"
2. Upload `company_faq.pdf`
3. Ask: "What is your return policy?"
4. Get accurate answer from PDF content!

## 🔑 API Keys

- **Cerebras** (required): https://cerebras.ai - FREE 1M tokens/day
- **LlamaParse** (optional): https://cloud.llamaindex.ai - For scanned PDFs

## 📊 How It Works

```
PDF Upload → Extract Text → Chunk Content → Store in DB
    ↓
User Question → Search Chunks → Get Context → Llama Response
```

See [PDF_EXTRACTION_GUIDE.md](PDF_EXTRACTION_GUIDE.md) for technical details!

## 🎉 What You Can Build

- FAQ chatbots from PDF documents
- Technical documentation assistants
- Product manual support bots
- Training material Q&A systems
- Company knowledge bases

---

**Built with ❤️ using Supabase, React, and Llama models**
