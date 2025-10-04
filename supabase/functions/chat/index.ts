import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY") || "";
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

interface ChatRequest {
  agent_id: string;
  message: string;
  conversation_id: string;
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

    const { agent_id, message, conversation_id }: ChatRequest = await req.json();

    if (!agent_id || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("system_prompt")
      .eq("id", agent_id)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: "Agent not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: chunks, error: chunksError } = await supabase.rpc(
      "search_chunks",
      {
        query_agent_id: agent_id,
        query_text: message,
        match_count: 5,
      }
    );

    let context = "";
    if (chunks && chunks.length > 0) {
      context = chunks
        .map((chunk: any) => chunk.content)
        .join("\n\n");
    }

    const systemPrompt = agent.system_prompt || "You are a helpful AI assistant.";
    const contextPrompt = context
      ? `\n\nContext from knowledge base:\n${context}\n\nUse this context to answer the user's question accurately. If the context doesn't contain relevant information, say so.`
      : "\n\nNo relevant context found in the knowledge base. Answer based on general knowledge.";

    const cerebrasResponse = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages: [
          {
            role: "system",
            content: systemPrompt + contextPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!cerebrasResponse.ok) {
      const errorText = await cerebrasResponse.text();
      console.error("Cerebras API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to generate response",
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cerebrasData = await cerebrasResponse.json();
    const assistantMessage = cerebrasData.choices[0]?.message?.content || "I couldn't generate a response.";

    const { data: savedMessage, error: saveError } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        role: "assistant",
        content: assistantMessage,
        retrieved_chunks: chunks?.map((c: any) => c.id) || [],
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        message_id: savedMessage?.id,
        chunks_used: chunks?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});