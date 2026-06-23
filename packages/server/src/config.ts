export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const config = {
  get llmBaseUrl() { return getEnv("LLM_BASE_URL"); },
  get llmApiKey() { return getEnv("LLM_API_KEY"); },
  get llmModel() { return getEnv("LLM_MODEL", "gpt-4o-mini"); },
  get piModelProvider() { return getEnv("PI_MODEL_PROVIDER", "openai"); },
  get piModelName() { return getEnv("PI_MODEL_NAME", this.llmModel); },
  get mcpServerUrls() {
    const urls = getEnv("MCP_SERVER_URLS", "");
    return urls ? urls.split(",").map(u => u.trim()).filter(Boolean) : [];
  },
  get port() { return Number(getEnv("PORT", "3000")); },
};
