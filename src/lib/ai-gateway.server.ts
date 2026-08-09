import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? true,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function getGatewayModel(modelId = "google/gemini-3.6-flash") {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured yet. Missing API key.");
  return createLovableAiGatewayProvider(key, { structuredOutputs: true })(modelId);
}