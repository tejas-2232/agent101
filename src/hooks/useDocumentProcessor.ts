import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDocumentProcessor(agentId: string | null) {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    const checkAndProcessDocuments = async () => {
      const { data: pendingDocs, error } = await supabase
        .from('documents')
        .select('id')
        .eq('agent_id', agentId)
        .eq('processing_status', 'pending');

      if (error || !pendingDocs || pendingDocs.length === 0) return;

      setProcessing(true);

      for (const doc of pendingDocs) {
        try {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ document_id: doc.id }),
          });
        } catch (err) {
          console.error('Error processing document:', err);
        }
      }

      setProcessing(false);
    };

    checkAndProcessDocuments();

    const interval = setInterval(checkAndProcessDocuments, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  return { processing };
}
