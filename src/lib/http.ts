export async function safeParseJson<T = unknown>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function getApiErrorMessage(
  payload: unknown,
  fallback = "No se pudo procesar la solicitud",
): string {
  if (!payload || typeof payload !== "object") return fallback;
  const errorValue = (payload as { error?: unknown }).error;
  return typeof errorValue === "string" && errorValue.trim() ? errorValue : fallback;
}
