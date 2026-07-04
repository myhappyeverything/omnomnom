export interface CompressedImage {
  base64: string
  mimeType: 'image/jpeg'
}

/**
 * Resizes to a max dimension and re-encodes as JPEG before it ever leaves the
 * device — the single biggest lever on OpenAI Vision cost, since every byte
 * saved here is a byte the API (and the KV cache) never has to touch.
 */
export async function compressImage(
  file: File,
  maxDimension = 1024,
  quality = 0.8,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) throw new Error('Image compression failed')

  const base64 = await blobToBase64(blob)
  return { base64, mimeType: 'image/jpeg' }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip the "data:image/jpeg;base64," prefix — the API wants raw base64.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
