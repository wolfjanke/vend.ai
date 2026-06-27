import {
  LGPD_ADMIN_ANON_LIMIT,
  LGPD_ADMIN_ANON_WINDOW_MS,
  PHOTO_ANALYZE_BURST_LIMIT,
  PHOTO_ANALYZE_BURST_WINDOW_MS,
  UPLOAD_POST_LIMIT,
  UPLOAD_POST_WINDOW_MS,
} from '@/lib/rate-limit-config'
import { checkStoreRateLimit } from '@/lib/rate-limit-helpers'

export {
  LGPD_ADMIN_ANON_LIMIT,
  LGPD_ADMIN_ANON_WINDOW_MS,
  PHOTO_ANALYZE_BURST_LIMIT,
  PHOTO_ANALYZE_BURST_WINDOW_MS,
  UPLOAD_POST_LIMIT,
  UPLOAD_POST_WINDOW_MS,
} from '@/lib/rate-limit-config'

export async function checkUploadPostRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit('upload', storeId, UPLOAD_POST_LIMIT, UPLOAD_POST_WINDOW_MS)
}

export async function checkLgpdAdminAnonymizeRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit(
    'lgpd:admin-anon',
    storeId,
    LGPD_ADMIN_ANON_LIMIT,
    LGPD_ADMIN_ANON_WINDOW_MS,
  )
}

export async function checkPhotoAnalyzeBurstRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit(
    'photo:analyze:burst',
    storeId,
    PHOTO_ANALYZE_BURST_LIMIT,
    PHOTO_ANALYZE_BURST_WINDOW_MS,
  )
}
