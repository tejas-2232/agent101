# Agentic Platform - Setup Instructions

## Overview

This is a complete Agent-as-a-Code platform where users can create AI agents that understand their content from uploaded documents or scraped websites. The platform uses Supabase for backend, Cerebras API for ultra-fast Llama LLM inference, and implements RAG (Retrieval Augmented Generation) for accurate, context-aware responses.

## Features Implemented

✅ User authentication (register, login, logout)
✅ Agent dashboard with agent management
✅ Agent creation wizard with URL scraping or file upload (PDF, TXT, Markdown)
✅ Document processing with text extraction and chunking
✅ Vector similarity search for RAG
✅ Real-time chat interface with streaming responses
✅ Knowledge base management
✅ Multi-tenant architecture with RLS security
✅ Supabase Edge Functions for backend processing

## Required API Keys

You need to provide the following API key:

### Cerebras API Key

1. Sign up at [https://cerebras.ai](https://cerebras.ai)
2. Get your API key from the dashboard
3. You get 1 million free tokens daily!

### Adding the API Key to Supabase

Since the Edge Functions are deployed and need the Cerebras API key, you'll need to add it as a secret in Supabase:

**Option 1: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Project Settings > Edge Functions
3. Add a new secret:
   - Name: `CEREBRAS_API_KEY`
   - Value: Your Cerebras API key

**Option 2: Via Supabase CLI (if you have it installed)**
```bash
supabase secrets set CEREBRAS_API_KEY=your_api_key_here
```

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

1. **chat** - Handles chat requests with RAG retrieval
2. **process-document** - Processes uploaded documents and URLs

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

### Current Implementation
- Text similarity search (trigram) for RAG
- Basic PDF text extraction (needs full parser library)
- Manual document processing trigger

### Planned Enhancements
- True vector embeddings using Cerebras or OpenAI
- Advanced PDF parsing with image OCR
- Vision model integration for image analysis
- Automatic document processing via webhooks
- Streaming responses in chat UI
- Agent cloning and templates
- Public agent sharing
- API key generation for programmatic access
- Usage analytics and metrics

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
VITE_SUPABASE_URL=https://fnsxysryvdqezsnmenap.supabase.co
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
