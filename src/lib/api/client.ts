export async function parseApiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);

  if (body && typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }

  return fallback;
}
