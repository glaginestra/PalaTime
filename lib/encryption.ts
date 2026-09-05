import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Asegúrate de tener una variable de entorno de 32 bytes (64 caracteres hex) en tu .env:
// ENCRYPTION_KEY="tu_clave_secreta_de_64_caracteres_hexadecimales..."
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; 

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY no está configurada');
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  // Guardamos el iv, el tag y el texto cifrado juntos separados por dos puntos
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY no está configurada');
  const [ivHex, tagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}