/** Cloudinary está pronto quando as três variáveis de ambiente estão preenchidas. */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey    = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  return Boolean(cloudName && apiKey && apiSecret)
}
