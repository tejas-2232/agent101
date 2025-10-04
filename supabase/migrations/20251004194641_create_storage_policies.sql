/*
  # Create Storage Policies for Documents Bucket

  ## Overview
  Sets up Row Level Security policies for the documents storage bucket to ensure users can only
  access their own uploaded files.

  ## Security
  - Users can upload files to their own folders
  - Users can read files from their own folders
  - Users can delete files from their own folders
  - Folder structure: user_id/agent_id/filename
*/

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create function to automatically trigger document processing
CREATE OR REPLACE FUNCTION trigger_document_processing()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
BEGIN
  -- Only trigger if status is pending
  IF NEW.processing_status = 'pending' THEN
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-document';
    
    -- Use pg_net extension to make async HTTP request (if available)
    -- For now, we'll just mark it as pending and process via webhook or manual trigger
    -- In production, you'd use Supabase's webhook or pg_net extension
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on documents table
CREATE TRIGGER on_document_created
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_document_processing();
