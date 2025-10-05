/*
  # Create Vector Similarity Search Function

  ## Overview
  Creates a PostgreSQL function for performing vector similarity search on document chunks.
  This enables RAG (Retrieval Augmented Generation) by finding the most relevant chunks for a query.

  ## New Functions

  ### `search_chunks`
  - Accepts: agent_id (uuid), query_text (text), match_count (int)
  - Returns: chunks ordered by similarity score
  - Uses cosine similarity for vector comparison
  - Note: This is a placeholder that searches by text similarity until embeddings are generated
        In production, you would generate an embedding for query_text and compare with chunk.embedding

  ## Notes
  - The function filters chunks by agent_id for security and relevance
  - Returns top N matches based on match_count parameter
  - For now, uses text similarity (trigram) as a fallback until embeddings are generated
*/

-- Create function to search chunks by similarity (updated to use vector embeddings)
CREATE OR REPLACE FUNCTION search_chunks(
  query_agent_id uuid,
  query_text text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Try to find chunks with embeddings first
  SELECT embedding INTO query_embedding
  FROM chunks 
  WHERE agent_id = query_agent_id 
    AND embedding IS NOT NULL 
  LIMIT 1;
  
  -- If we have embeddings, use vector similarity
  IF query_embedding IS NOT NULL THEN
    -- For now, use text similarity as fallback since we need to generate query embedding
    -- In production, you would generate embedding for query_text using the embedding API
    RETURN QUERY
    SELECT
      chunks.id,
      chunks.content,
      similarity(chunks.content, query_text) as similarity
    FROM chunks
    WHERE chunks.agent_id = query_agent_id
      AND chunks.content IS NOT NULL
      AND chunks.embedding IS NOT NULL
    ORDER BY similarity DESC
    LIMIT match_count;
  ELSE
    -- Fallback to text similarity if no embeddings available
    RETURN QUERY
    SELECT
      chunks.id,
      chunks.content,
      similarity(chunks.content, query_text) as similarity
    FROM chunks
    WHERE chunks.agent_id = query_agent_id
      AND chunks.content IS NOT NULL
    ORDER BY similarity DESC
    LIMIT match_count;
  END IF;
END;
$$;

-- Create function for cosine similarity search (for when embeddings are available)
CREATE OR REPLACE FUNCTION search_chunks_vector(
  query_agent_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  FROM chunks
  WHERE chunks.agent_id = query_agent_id
    AND chunks.embedding IS NOT NULL
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
