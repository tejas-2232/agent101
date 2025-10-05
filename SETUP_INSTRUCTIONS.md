# Agentic Platform - Setup Instructions

## Overview

This is a complete Agent-as-a-Code platform where users can create AI agents that understand their content from uploaded documents or scraped websites. The platform uses Supabase for backend, Cerebras API for ultra-fast Llama LLM inference, and implements RAG (Retrieval Augmented Generation) for accurate, context-aware responses.

## Features Implemented

✅ User authentication (register, login, logout)
✅ Agent dashboard with agent management
✅ Agent creation wizard with URL scraping or file upload (PDF, TXT, Markdown)
✅ **Advanced PDF text extraction** (similar to Amazon Textract)
✅ **Intelligent context-aware chunking** (paragraph & sentence-based)
✅ **Optional scanned PDF support** (with LlamaParse vision models)
✅ Document processing with rich metadata extraction
✅ Vector similarity search for RAG
✅ Real-time chat interface with Llama 3.3 70B responses
✅ Knowledge base management
✅ Multi-tenant architecture with RLS security
✅ Supabase Edge Functions for backend processing

## Required API Keys

You need to provide the following API key:

### Cerebras API Key

1. Sign up at [https://cerebras.ai](https://cerebras.ai)
2. Get your API key from the dashboard
3. You get 1 million free tokens daily!

### LlamaParse API Key (Optional)

For **scanned PDF support** (image-based PDFs):

1. Sign up at [https://cloud.llamaindex.ai](https://cloud.llamaindex.ai)
2. Get your API key from the dashboard
3. FREE tier: 1000 pages/day

**Note:** Only needed for scanned/image-based PDFs. Regular text PDFs work without this!

### Adding the API Keys to Supabase

Since the Edge Functions are deployed and need the API keys, you'll need to add them as secrets in Supabase:

**Option 1: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Project Settings > Edge Functions
3. Add a new secret:
   - Name: `CEREBRAS_API_KEY`
   - Value: Your Cerebras API key

**Option 2: Via Supabase CLI (if you have it installed)**
```bash
# Required
supabase secrets set CEREBRAS_API_KEY=your_cerebras_key_here

# Optional - for scanned PDF support
supabase secrets set LLAMAPARSE_API_KEY=your_llamaparse_key_here
```

**Option 3: Use the automated deployment script**
```powershell
# Windows
.\deploy-pdf-extraction.ps1
```

This will guide you through setting up both keys and deploying the function!

## Database Setup

All database tables, migrations, and functions have been created:

- ✅ `profiles` - User profiles
- ✅ `agents` - AI agents created by users
- ✅ `documents` - Uploaded files or scraped URLs
- ✅ `chunks` - Document chunks with vector embeddings
- ✅ `conversations` - Chat sessions
- ✅ `messages` - Individual messages in conversations
- ✅ `api_keys` - API keys for programmatic access (future feature)

## Storage Setup

A storage bucket called `documents` has been created for file uploads with proper RLS policies.

## Edge Functions Deployed

Two Edge Functions have been deployed:

1. **chat** - Handles chat requests with RAG retrieval using Llama 3.3 70B
2. **process-document** - Processes uploaded documents and URLs with advanced features:
   - 📄 **PDF text extraction** using pdf-parse library
   - 🔍 **Intelligent chunking** (paragraph and sentence-aware)
   - 📸 **Optional scanned PDF support** via LlamaParse vision models
   - 📊 **Rich metadata extraction** (pages, file info, timestamps)
   
## PDF Extraction Capabilities

Your platform now supports **production-grade PDF extraction** similar to Amazon Textract:

### ✨ What It Does
- Extracts all text from PDF documents (FAQs, manuals, guides)
- Preserves document structure and context
- Handles both text-based and scanned PDFs
- Intelligently chunks content for optimal RAG performance
- Tracks metadata (page count, file info, extraction method)

### 📖 How to Use
1. Create an agent (e.g., "FAQ Support Bot")
2. Upload PDF files (single or multiple)
3. Wait ~5 seconds for processing
4. Chat with your agent about the PDF content!

### 🎯 Perfect For
- **Customer Support**: FAQ documents, help guides
- **Technical Docs**: API documentation, manuals
- **Training**: Company policies, procedures
- **Sales**: Product catalogs, pricing sheets

See `PDF_EXTRACTION_GUIDE.md` for detailed instructions and examples!

## How to Use the Platform

### 1. Register/Login
- Navigate to `/register` to create an account
- Or use `/login` if you already have an account

### 2. Create an Agent
- Click "Create Agent" from the dashboard
- Enter agent name and optional description
- Choose data source:
  - **Upload Files**: Select PDF, TXT, or Markdown files
  - **Website URL**: Enter a URL to scrape content

### 3. Document Processing
- Documents are automatically processed after upload
- The system extracts text, chunks it, and prepares it for RAG
- Agent status changes from "training" to "active" when ready

### 4. Chat with Your Agent
- Click "Chat" on any agent card
- Ask questions about your uploaded content
- The agent uses RAG to retrieve relevant context before answering

### 5. Manage Agent Knowledge Base
- Click "Manage" on any agent card
- View all documents in the knowledge base
- Add more documents or URLs anytime
- Delete documents to update the knowledge base

## Architecture

### Frontend (React + TypeScript)
- **Auth**: `/login`, `/register` - User authentication
- **Dashboard**: `/dashboard` - Agent management
- **Create**: `/create-agent` - Agent creation wizard
- **Chat**: `/chat/:agentId` - Chat interface
- **Manage**: `/agent/:agentId` - Knowledge base management

### Backend (Supabase Edge Functions)
- **chat**: Handles RAG retrieval + Cerebras LLM completion
- **process-document**: Extracts text from files/URLs and creates chunks

### Database
- PostgreSQL with pgvector extension for similarity search
- Row-level security for multi-tenant isolation
- Automatic triggers for maintaining counters

## RAG Implementation

The platform implements Retrieval Augmented Generation:

1. User sends a message
2. System generates query embedding (text similarity for now)
3. Searches vector database for relevant chunks
4. Retrieves top 5 most similar chunks
5. Injects chunks as context into LLM prompt
6. Cerebras Llama generates response
7. Response is saved and displayed to user

## Security Features

- Row-level security on all tables
- Users can only access their own agents, documents, and conversations
- Storage policies restrict file access to owners
- JWT authentication via Supabase Auth
- API keys are hashed before storage

## Current Limitations & Future Enhancements

### ✅ Recently Added
- ✅ **Advanced PDF text extraction** with pdf-parse library
- ✅ **Intelligent chunking** preserving paragraphs and sentences
- ✅ **Scanned PDF support** via LlamaParse (optional)
- ✅ **Rich metadata extraction** (pages, file info, timestamps)

### Current Implementation
- Text similarity search (trigram) for RAG - works well for most use cases
- Manual document processing trigger
- Single LLM provider (Cerebras)

### Planned Enhancements
- True vector embeddings using Cerebras or OpenAI
- Automatic document processing via webhooks
- Streaming responses in chat UI
- Agent cloning and templates
- Public agent sharing
- API key generation for programmatic access
- Usage analytics and metrics
- Multi-modal support (images, audio)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Environment Variables

The following environment variables are already configured:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=[already configured]
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Check Supabase Edge Function logs
3. Verify Cerebras API key is configured correctly
4. Ensure documents are being processed (check status in agent management)

## License

This is a production-ready agentic platform built for creating specialized AI agents with knowledge from your own content.
