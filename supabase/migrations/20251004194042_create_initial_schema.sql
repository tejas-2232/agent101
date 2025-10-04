/*
  # Initial Schema for Agentic Platform

  ## Overview
  Creates the complete database schema for an agent-as-a-code platform where users can create AI agents
  that understand their content from websites or documents (PDF, TXT, Markdown).

  ## New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `agents`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text) - Agent display name
  - `description` (text, nullable) - Agent purpose description
  - `system_prompt` (text) - Custom system prompt for agent behavior
  - `status` (text) - Agent status: 'training', 'active', 'error', 'inactive'
  - `total_documents` (integer) - Count of documents in knowledge base
  - `total_chunks` (integer) - Count of processed chunks
  - `last_trained_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `documents`
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `source_type` (text) - 'url' or 'file'
  - `source_url` (text, nullable) - Original URL if scraped
  - `file_name` (text, nullable) - Original filename if uploaded
  - `file_type` (text, nullable) - pdf, txt, md
  - `file_size` (bigint, nullable) - File size in bytes
  - `storage_path` (text, nullable) - Path in Supabase Storage
  - `content_preview` (text, nullable) - First 500 chars preview
  - `processing_status` (text) - 'pending', 'processing', 'completed', 'error'
  - `error_message` (text, nullable)
  - `total_chunks` (integer) - Number of chunks created from this document
  - `created_at` (timestamptz)
  - `processed_at` (timestamptz, nullable)

  ### `chunks`
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `agent_id` (uuid, references agents)
  - `content` (text) - The actual text content
  - `embedding` (vector(1536)) - Vector embedding for similarity search
  - `chunk_index` (integer) - Order of chunk in document
  - `metadata` (jsonb) - Additional metadata (page number, section, etc.)
  - `token_count` (integer)
  - `created_at` (timestamptz)

  ### `conversations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `agent_id` (uuid, references agents)
  - `title` (text, nullable) - Generated from first message
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references conversations)
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message content
  - `retrieved_chunks` (jsonb, nullable) - Array of chunk IDs used for context
  - `token_count` (integer, nullable)
  - `created_at` (timestamptz)

  ### `api_keys`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `key_hash` (text) - Hashed API key
  - `key_prefix` (text) - First 8 chars for display
  - `name` (text) - User-defined key name
  - `last_used_at` (timestamptz, nullable)
  - `usage_count` (integer)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Agents, documents, and chunks are accessible only to their owners
  - Conversations and messages are private to users
  - API keys are private and hashed

  ## Indexes
  - Foreign key indexes for performance
  - Vector index on chunks.embedding for fast similarity search
  - Text search indexes on content fields
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  system_prompt text DEFAULT 'You are a helpful AI assistant. Answer questions based on the provided context accurately and concisely.',
  status text DEFAULT 'active' CHECK (status IN ('training', 'active', 'error', 'inactive')),
  total_documents integer DEFAULT 0,
  total_chunks integer DEFAULT 0,
  last_trained_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('url', 'file')),
  source_url text,
  file_name text,
  file_type text,
  file_size bigint,
  storage_path text,
  content_preview text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  error_message text,
  total_chunks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  token_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  retrieved_chunks jsonb,
  token_count integer,
  created_at timestamptz DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  name text NOT NULL,
  last_used_at timestamptz,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_documents_agent_id ON documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_agent_id ON chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Create vector similarity search index using HNSW
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);

-- Create text search index for content
CREATE INDEX IF NOT EXISTS idx_chunks_content_trgm ON chunks USING gin (content gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view documents of own agents"
  ON documents FOR SELECT
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Users can create documents for own agents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update documents of own agents"
  ON documents FOR UPDATE
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete documents of own agents"
  ON documents FOR DELETE
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Chunks policies
CREATE POLICY "Users can view chunks of own agents"
  ON chunks FOR SELECT
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Users can create chunks for own agents"
  ON chunks FOR INSERT
  TO authenticated
  WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete chunks of own agents"
  ON chunks FOR DELETE
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  TO authenticated
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

-- API Keys policies
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update agent counters when documents/chunks change
CREATE OR REPLACE FUNCTION update_agent_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'documents' THEN
    UPDATE agents
    SET total_documents = (SELECT COUNT(*) FROM documents WHERE agent_id = NEW.agent_id AND processing_status = 'completed')
    WHERE id = NEW.agent_id;
  ELSIF TG_TABLE_NAME = 'chunks' THEN
    UPDATE agents
    SET total_chunks = (SELECT COUNT(*) FROM chunks WHERE agent_id = NEW.agent_id)
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for agent counters
CREATE TRIGGER update_agent_document_count AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_agent_counters();

CREATE TRIGGER update_agent_chunk_count AFTER INSERT OR DELETE ON chunks
  FOR EACH ROW EXECUTE FUNCTION update_agent_counters();
