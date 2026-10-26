'use client'

/** A call to the theme's own routes from the browser: the answer, its status, the site's messages. */
export interface Answer<T> { ok: boolean; status: number; data: T; message: string | null; errors: Record<string, string> }

export async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<Answer<T>> {
  const response = await fetch(path, body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await response.json().catch(() => ({}))) as T & { message?: string; errors?: Record<string, string[]>; data?: { params?: Record<string, string> } }

  // WordPress's REST errors carry the fields in data.params; Laravel's forms in errors.
  const errors: Record<string, string> = { ...(data?.data?.params ?? {}) }
  for (const [field, messages] of Object.entries(data?.errors ?? {})) errors[field] = messages[0] ?? ''

  return { ok: response.ok, status: response.status, data, message: data?.message ?? null, errors }
}
