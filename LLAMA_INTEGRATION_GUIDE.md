# Enhanced Llama Integration - Implementation Guide

## Overview

Your agentic platform has been enhanced with comprehensive Llama integration, providing better RAG performance, model selection capabilities, and improved vector similarity search.

## 🚀 New Features Implemented

### 1. **Multi-Model Support**
- **Llama 3.3 70B**: Most capable model for complex reasoning (2000 max tokens)
- **Llama 3.1 70B**: Balanced performance and speed (1500 max tokens)  
- **Llama 3.1 8B**: Fast responses for simple queries (1000 max tokens)

### 2. **Vector Embeddings with Llama**
- Automatic embedding generation for document chunks
- Query embedding generation for improved RAG retrieval
- True vector similarity search using cosine similarity
- Fallback to text similarity when embeddings unavailable

### 3. **Model Selection UI**
- Model selection during agent creation
- Model display in chat interface
- Per-agent model configuration
- Custom temperature and max tokens settings

### 4. **Enhanced RAG Pipeline**
- Query embedding generation for better context retrieval
- Vector similarity search with pgvector
- Improved chunk relevance scoring
- Context-aware response generation

## 📁 Files Modified/Created

### New Edge Functions
- `supabase/functions/generate-embeddings/index.ts` - Embedding generation service
- `supabase/migrations/20251004195000_enhanced_vector_search.sql` - Enhanced search functions
- `supabase/migrations/20251004195100_add_model_selection.sql` - Model selection schema

### Updated Files
- `supabase/functions/chat/index.ts` - Enhanced with model selection and query embeddings
- `supabase/functions/process-document/index.ts` - Added embedding generation for chunks
- `supabase/migrations/20251004194547_create_search_function.sql` - Updated search logic
- `src/pages/CreateAgent.tsx` - Added model selection UI
- `src/pages/Chat.tsx` - Added model display and enhanced agent loading

## 🔧 Database Schema Changes

### Agents Table
```sql
ALTER TABLE agents 
ADD COLUMN model text DEFAULT 'llama-3.3-70b',
ADD COLUMN temperature real DEFAULT 0.7,
ADD COLUMN max_tokens integer DEFAULT 1000;
```

### Enhanced Search Functions
- `search_chunks()` - Updated to prioritize chunks with embeddings
- `search_chunks_by_vector()` - True vector similarity search
- `search_chunks_with_query_embedding()` - Query embedding generation

## 🚀 How to Deploy

### 1. Deploy New Edge Functions
```bash
# Deploy the new embedding generation function
supabase functions deploy generate-embeddings

# Redeploy updated functions
supabase functions deploy chat
supabase functions deploy process-document
```

### 2. Run Database Migrations
```bash
# Apply the new migrations
supabase db push
```

### 3. Update Environment Variables
Ensure your Supabase project has the `CEREBRAS_API_KEY` secret configured:
```bash
supabase secrets set CEREBRAS_API_KEY=your_cerebras_api_key
```

## 🎯 Usage Examples

### Creating an Agent with Model Selection
1. Navigate to `/create-agent`
2. Enter agent name and description
3. Select Llama model from dropdown:
   - **Llama 3.3 70B** for complex reasoning tasks
   - **Llama 3.1 70B** for balanced performance
   - **Llama 3.1 8B** for fast, simple queries
4. Upload documents or provide URLs
5. Agent will process with selected model

### Enhanced Chat Experience
- Chat interface shows selected model
- Automatic query embedding generation
- Improved context retrieval with vector similarity
- Better response quality with model-specific parameters

### Document Processing
- Automatic embedding generation for all chunks
- Vector storage in PostgreSQL with pgvector
- Enhanced search performance
- Metadata tracking for embedding status

## 🔍 Technical Implementation Details

### RAG Pipeline Flow
1. **User Query** → Generate query embedding via Cerebras API
2. **Vector Search** → Find similar chunks using cosine similarity
3. **Context Assembly** → Combine top 5 most relevant chunks
4. **LLM Generation** → Generate response with context using selected model
5. **Response Storage** → Save message with retrieved chunk IDs

### Embedding Generation
- Uses Cerebras API for consistent embedding model
- 1536-dimensional vectors stored in PostgreSQL
- Automatic retry logic for failed embedding generation
- Fallback to text similarity when embeddings unavailable

### Model Configuration
- Per-agent model selection stored in database
- Custom temperature and max tokens settings
- Model-specific parameter optimization
- Runtime model switching capability

## 📊 Performance Improvements

### Vector Search Benefits
- **Faster Retrieval**: Vector similarity is faster than text search for large datasets
- **Better Relevance**: Semantic similarity vs keyword matching
- **Scalability**: Vector indexes scale better with document count
- **Accuracy**: Improved context retrieval for better responses

### Model Selection Benefits
- **Task Optimization**: Choose appropriate model for use case
- **Cost Management**: Use smaller models for simple tasks
- **Performance Tuning**: Custom parameters per agent
- **Flexibility**: Easy model switching without code changes

## 🛠️ Configuration Options

### Model Parameters
```typescript
const LLAMA_MODELS = {
  "llama-3.3-70b": {
    name: "Llama 3.3 70B",
    description: "Most capable model for complex reasoning",
    maxTokens: 2000,
    temperature: 0.7
  },
  "llama-3.1-70b": {
    name: "Llama 3.1 70B", 
    description: "Balanced performance and speed",
    maxTokens: 1500,
    temperature: 0.7
  },
  "llama-3.1-8b": {
    name: "Llama 3.1 8B",
    description: "Fast responses for simple queries",
    maxTokens: 1000,
    temperature: 0.8
  }
};
```

### Search Configuration
- **Match Count**: Default 5 chunks for context
- **Similarity Threshold**: Configurable minimum similarity score
- **Fallback Strategy**: Text similarity when embeddings unavailable
- **Caching**: Query embedding caching for repeated queries

## 🔒 Security Considerations

### API Key Management
- Cerebras API key stored as Supabase secret
- No client-side exposure of API keys
- Service role key for Edge Function authentication
- Row-level security maintained for all operations

### Data Privacy
- Embeddings generated server-side only
- No embedding data exposed to client
- User data isolation maintained
- Secure vector storage with RLS policies

## 🚨 Troubleshooting

### Common Issues

1. **Embedding Generation Fails**
   - Check Cerebras API key configuration
   - Verify API quota and limits
   - Check Edge Function logs for errors

2. **Vector Search Not Working**
   - Ensure pgvector extension is enabled
   - Verify embeddings are being generated
   - Check database migration status

3. **Model Selection Not Saving**
   - Verify database migration applied
   - Check agent creation form submission
   - Validate model name constraints

### Debug Steps
1. Check Supabase Edge Function logs
2. Verify database schema updates
3. Test embedding generation endpoint
4. Validate model configuration
5. Check browser console for errors

## 🎉 Next Steps

### Immediate Actions
1. Deploy the new Edge Functions
2. Run database migrations
3. Test model selection in agent creation
4. Verify embedding generation works
5. Test enhanced chat functionality

### Future Enhancements
- **Streaming Responses**: Real-time response streaming
- **Custom Embeddings**: User-defined embedding models
- **Analytics**: Usage tracking and performance metrics
- **Batch Processing**: Bulk embedding generation
- **Model Fine-tuning**: Custom model training capabilities

## 📞 Support

For issues or questions:
1. Check Edge Function logs in Supabase dashboard
2. Verify Cerebras API key configuration
3. Ensure all migrations are applied
4. Test embedding generation endpoint
5. Check browser console for client-side errors

Your agentic platform now has enterprise-grade Llama integration with advanced RAG capabilities! 🚀
