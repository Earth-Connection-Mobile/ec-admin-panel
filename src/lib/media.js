const WORKER_URL = import.meta.env.VITE_WORKER_URL

/**
 * Upload a file to R2 via the Cloudflare Worker.
 */
export async function uploadToR2(file, key, session) {
  const response = await fetch(`${WORKER_URL}/upload/${key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }
  return await response.json()
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key, session) {
  const response = await fetch(`${WORKER_URL}/media/${key}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  })
  if (!response.ok) throw new Error('Delete failed')
}

/**
 * Generate a unique R2 key for a file.
 */
export function generateFileKey(prefix, filename) {
  const uuid = crypto.randomUUID()
  const ext = filename.split('.').pop().toLowerCase()
  return `${prefix}/${uuid}.${ext}`
}

/**
 * Get the full media URL for an R2 key (for use with auth headers).
 */
export function getMediaUrl(key) {
  return `${WORKER_URL}/media/${key}`
}

/**
 * Fetch an image from R2 with auth and return a blob URL for display.
 * Regular <img> tags can't send Bearer tokens, so we fetch manually.
 */
export async function fetchImageAsBlob(key, session) {
  try {
    const response = await fetch(`${WORKER_URL}/media/${key}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (!response.ok) return null
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/**
 * Extract audio duration using Web Audio API.
 */
export async function getAudioDuration(file) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.round(audio.duration)
      URL.revokeObjectURL(audio.src)
      resolve(duration)
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src)
      resolve(0)
    })
  })
}

/**
 * Format seconds to m:ss display.
 */
export function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
