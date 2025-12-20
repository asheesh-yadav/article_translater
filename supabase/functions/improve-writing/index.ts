import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai";

/* -------------------- ENV SETUP -------------------- */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/* -------------------- CORS -------------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* -------------------- TYPES -------------------- */

type Mode =
  | "default"
  | "formal"
  | "informal"
  | "concise"
  | "expand"
  | "simplify"
  | "polish"
  | "academic"
  | "friendly"
  | "persuasive"
  | "clarify";

interface ImprovementRequest {
  text: string;
  language?: string;
  mode?: Mode;
  variant?: number;
}

interface Suggestion {
  text: string;
  label: string;
  type: "rewrite";
}

/* -------------------- PROMPT -------------------- */

function buildPrompt(
  text: string,
  language: string,
  mode: Mode,
  variant: number
): string {
  return `
You are a professional AI writing assistant.

IMPORTANT:
This request has a UNIQUE VARIANT ID: ${variant}
You MUST generate a fresh response. Do NOT reuse previous phrasing.

TASK:
Rewrite the text below in ${language}.
Mode: ${mode}

STRICT RULES:
- Generate EXACTLY 7 rewrites
- Each rewrite MUST have:
  - Different sentence structure
  - Different tone
  - Different phrasing
- No synonym swaps
- No repeated openings
- No similar rhythm

OUTPUT:
Return ONLY valid JSON array.
No markdown.
No explanation.

JSON FORMAT:
[
  { "label": "Rewrite 1", "text": "..." },
  { "label": "Rewrite 2", "text": "..." }
]

TEXT:
"""${text}"""
`;
}

/* -------------------- GPT CALL -------------------- */

async function generateSuggestions(
  text: string,
  language: string,
  mode: Mode,
  variant: number
): Promise<Suggestion[]> {
  const prompt = buildPrompt(text, language, mode, variant);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.95,
    messages: [
      {
        role: "system",
        content: "You ONLY output valid JSON arrays.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty GPT response");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON from GPT");
  }

  if (!Array.isArray(parsed) || parsed.length !== 7) {
    throw new Error("Incorrect suggestion count");
  }

  return parsed.map((item) => ({
    text: item.text,
    label: item.label,
    type: "rewrite",
  }));
}

/* -------------------- EDGE HANDLER -------------------- */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ImprovementRequest = await req.json();

    if (!body.text?.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const suggestions = await generateSuggestions(
      body.text,
      body.language || "English",
      body.mode || "default",
      body.variant || Date.now()
    );

    return new Response(
      JSON.stringify({
        improvedText: suggestions[0].text,
        suggestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI writing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
