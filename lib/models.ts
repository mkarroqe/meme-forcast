export const AI_GATEWAY_MODELS = [
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (default)" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "openai/gpt-5.4", label: "GPT-5.4" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 nano" },
] as const;

export type GatewayModelId = (typeof AI_GATEWAY_MODELS)[number]["id"];

export const DEFAULT_MODEL: GatewayModelId = AI_GATEWAY_MODELS[0].id;

const KNOWN = new Set<string>(AI_GATEWAY_MODELS.map((m) => m.id));

export function isGatewayModelId(id: string): id is GatewayModelId {
  return KNOWN.has(id);
}

/** Picks a valid model id, or falls back to env then default. */
export function resolveHoroscopeModel(requested?: string | null): GatewayModelId {
  const fromEnv = process.env.AI_GATEWAY_MODEL?.trim();
  if (requested && isGatewayModelId(requested)) return requested;
  if (fromEnv && isGatewayModelId(fromEnv)) return fromEnv;
  return DEFAULT_MODEL;
}
