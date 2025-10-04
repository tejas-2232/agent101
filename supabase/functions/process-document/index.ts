import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY") || "";

interface ProcessRequest {
  document_id: string;
}

function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent;
  } catch (error) {
    throw new Error(`URL scraping failed: ${error.message}`);
  }
}

async function extractTextFromFile(fileContent: Uint8Array, fileType: string): Promise<string> {
  const decoder = new TextDecoder('utf-8');
  
  if (fileType === 'txt' || fileType === 'md') {
    return decoder.decode(fileContent);
  }
  
  if (fileType === 'pdf') {
    return "PDF text extraction placeholder. Full PDF parsing requires additional libraries.";
  }
  
  return "Unsupported file type";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { document_id }: ProcessRequest = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "Missing document_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", document_id);

    let content = "";

    if (document.source_type === "url") {
      content = await scrapeUrl(document.source_url);
    } else if (document.source_type === "file") {
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(document.storage_path);

      if (fileError || !fileData) {
        throw new Error("Failed to download file");
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      content = await extractTextFromFile(uint8Array, document.file_type);
    }

    if (!content || content.trim().length === 0) {
      throw new Error("No content extracted");
    }

    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      await supabase
        .from("chunks")
        .insert({
          document_id: document_id,
          agent_id: document.agent_id,
          content: chunk,
          chunk_index: i,
          token_count: Math.ceil(chunk.length / 4),
          metadata: {
            source: document.source_type === "url" ? document.source_url : document.file_name,
          },
        });
    }

    await supabase
      .from("documents")
      .update({
        processing_status: "completed",
        processed_at: new Date().toISOString(),
        total_chunks: chunks.length,
        content_preview: content.slice(0, 500),
      })
      .eq("id", document_id);

    await supabase
      .from("agents")
      .update({
        status: "active",
        last_trained_at: new Date().toISOString(),
      })
      .eq("id", document.agent_id);

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: chunks.length,
        content_length: content.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Process document error:", error);

    const { document_id } = await req.json().catch(() => ({}));
    if (document_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase
        .from("documents")
        .update({
          processing_status: "error",
          error_message: error.message,
        })
        .eq("id", document_id);
    }

    return new Response(
      JSON.stringify({
        error: "Document processing failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});