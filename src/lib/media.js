/**
 * R2 Media Upload/Delete helpers via the Cloudflare Worker
 */

const workerUrl = import.meta.env.VITE_WORKER_URL

/**
 * Upload a file to R2 via the Cloudflare Worker.
 * PUT /upload/<key> with Authorization header and Content-Type.
 */
export async function uploadToR2(file, key, session) {
  const response = await fetch(`${workerUrl}/upload/${key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => 'Upload failed')
    throw new Error(text)
  }
  return await response.json()
}

/**
 * Delete a file from R2 via the Cloudflare Worker.
 * DELETE /media/<key> with Authorization header.
 */
export async function deleteFromR2(key, session) {
  const response = await fetch(`${workerUrl}/media/${key}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  if (!response.ok) {
    const text = await response.text().catch(() => 'Delete failed')
    throw new Error(text)
  }
  return await response.json()
}

/**
 * Generate a unique R2 key for a file.
 * @param {string} prefix - e.g. "audio", "covers"
 * @param {string} filename - original filename
 * @returns {string} key like "audio/abc123-def456.mp3"
 */
export function generateFileKey(prefix, filename) {
  const uuid = crypto.randomUUID()
  const ext = filename.split('.').pop().toLowerCase()
  return `${prefix}/${uuid}.${ext}`
}

/**
 * Extract audio duration (in seconds) using the Web Audio API.
 * Returns an integer (rounded).
 */
export async function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(e.target.result)
        const seconds = Math.round(audioBuffer.duration)
        audioContext.close()
        resolve(seconds)
      } catch (err) {
        reject(new Error('Could not decode audio: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Format seconds into mm:ss display string.
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
