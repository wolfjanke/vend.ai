import bcrypt from 'bcryptjs'

/** Cost factor para novos hashes (senhas antigas com cost 10 continuam válidas). */
export const BCRYPT_COST = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
