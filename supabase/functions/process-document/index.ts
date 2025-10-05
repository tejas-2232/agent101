import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
// @deno-types="npm:@types/pdf-parse@1.1.4"
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY") || "";
const LLAMAPARSE_API_KEY = Deno.env.get("LLAMAPARSE_API_KEY") || ""; // Optional: for advanced PDF parsing

interface ProcessRequest {
  document_id: string;
}

function chunkText(text: string, maxChunkSize: number = 1500, overlap: number = 200): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs first (double newlines)
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) continue;
    
    // If adding this paragraph would exceed max size
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize) {
      // Save current chunk if it has content
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap from end of previous chunk to start of next
        const words = currentChunk.split(/\s+/);
        const overlapWords = Math.min(Math.floor(overlap / 5), words.length);
        currentChunk = words.slice(-overlapWords).join(" ") + "\n\n";
      }
      
      // If single paragraph is too large, split by sentences
      if (trimmedParagraph.length > maxChunkSize) {
        const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/);
        let sentenceChunk = currentChunk;
        
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length > maxChunkSize) {
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim());
              sentenceChunk = "";
            }
          }
          sentenceChunk += sentence + " ";
        }
        currentChunk = sentenceChunk;
      } else {
        currentChunk += trimmedParagraph + "\n\n";
      }
    } else {
      currentChunk += trimmedParagraph + "\n\n";
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // If no chunks were created (shouldn't happen), fallback to simple chunking
  if (chunks.length === 0 && text.length > 0) {
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start >= text.length - overlap) break;
    }
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

async function extractTextFromPDF(fileContent: Uint8Array): Promise<{ text: string; metadata: any }> {
  try {
    // Convert Uint8Array to Buffer for pdf-parse
    // const buffer = Buffer.from(fileContent);
    // const pdfData = await pdfParse(buffer);
    
    // fix for pd fprocessing - trial and error
    // pdf-parse expects a Buffer-like object with data property
    // Create a compatible structure for Den
    const pdfBuffer = {
      data: fileContent,
      length: fileContent.length,
      toString: () => new TextDecoder().decode(fileContent),
    };
    
    const pdfData = await pdfParse(pdfBuffer);
    
    // Check if PDF has extractable text
    const hasText = pdfData.text && pdfData.text.trim().length > 100;
    
    return {
      text: pdfData.text,
      metadata: {
        pages: pdfData.numpages,
        info: pdfData.info,
        extraction_method: hasText ? "text" : "no_text",
        has_extractable_text: hasText,
      }
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Optional: Advanced PDF extraction using Llama Vision for scanned PDFs
// This can handle image-based PDFs and extract text from images
async function extractTextFromPDFWithVision(
  fileContent: Uint8Array,
  fileName: string
): Promise<{ text: string; metadata: any }> {
  // First try regular text extraction
  const standardResult = await extractTextFromPDF(fileContent);
  
  // If we got good text, return it
  if (standardResult.metadata.has_extractable_text) {
    return standardResult;
  }
  
  // If LLAMAPARSE_API_KEY is available, use LlamaParse for advanced extraction
  if (LLAMAPARSE_API_KEY) {
    try {
      console.log("Using LlamaParse for advanced PDF extraction...");
      
      // Create form data
      const formData = new FormData();
      const blob = new Blob([fileContent], { type: "application/pdf" });
      formData.append("file", blob, fileName);
      formData.append("language", "en");
      formData.append("result_type", "markdown"); // Get structured markdown output
      
      const uploadResponse = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LLAMAPARSE_API_KEY}`,
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`LlamaParse upload failed: ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      const jobId = uploadData.id;
      
      // Poll for results (with timeout)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const resultResponse = await fetch(
          `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
          {
            headers: {
              "Authorization": `Bearer ${LLAMAPARSE_API_KEY}`,
            },
          }
        );
        
        if (resultResponse.ok) {
          const resultText = await resultResponse.text();
          return {
            text: resultText,
            metadata: {
              ...standardResult.metadata,
              extraction_method: "llamaparse_vision",
              has_extractable_text: true,
            },
          };
        }
        
        attempts++;
      }
      
      throw new Error("LlamaParse processing timeout");
    } catch (visionError) {
      console.error("LlamaParse extraction failed:", visionError);
      // Fall back to standard result
      return {
        ...standardResult,
        text: standardResult.text || "⚠️ PDF appears to be image-based. No text could be extracted. Consider using LlamaParse API for scanned documents.",
      };
    }
  }
  
  // No vision API available and no text extracted
  return {
    ...standardResult,
    text: standardResult.text || "⚠️ PDF appears to be image-based. No text could be extracted. Add LLAMAPARSE_API_KEY for scanned document support.",
  };
}

async function extractTextFromFile(
  fileContent: Uint8Array,
  fileType: string,
  fileName?: string,
  useAdvancedExtraction: boolean = true
): Promise<{ text: string; metadata?: any }> {
  const decoder = new TextDecoder('utf-8');
  
  if (fileType === 'txt' || fileType === 'md') {
    return { text: decoder.decode(fileContent) };
  }
  
  if (fileType === 'pdf') {
    // Use advanced extraction with vision support if available
    if (useAdvancedExtraction && fileName) {
      return await extractTextFromPDFWithVision(fileContent, fileName);
    }
    // Otherwise use standard extraction
    return await extractTextFromPDF(fileContent);
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
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
    let documentMetadata: any = {};

    if (document.source_type === "url") {
      content = await scrapeUrl(document.source_url);
      documentMetadata = { source: "url" };
    } else if (document.source_type === "file") {
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(document.storage_path);

      if (fileError || !fileData) {
        throw new Error("Failed to download file");
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const extractionResult = await extractTextFromFile(
        uint8Array,
        document.file_type,
        document.file_name,
        true // Enable advanced extraction with vision support
      );
      content = extractionResult.text;
      documentMetadata = extractionResult.metadata || {};
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
            file_type: document.file_type,
            pages: documentMetadata.pages,
            ...documentMetadata,
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
        metadata: {
          ...documentMetadata,
          total_characters: content.length,
          extracted_at: new Date().toISOString(),
        },
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