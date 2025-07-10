export class EncryptionService {
  decodeBase64(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    try {
      return atob(str);
    } catch (e) {
      console.error('Base64 decode failed:', e);
      return '';
    }
  }

  async decrypt(encrypted, key) {
    if (!encrypted || !key) return '';
    try {
      const encoder = new TextEncoder();
      const iv = encoder.encode('000000000000'); // Placeholder IV, should match API spec
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'AES-GCM', length: 128 },
        false,
        ['decrypt']
      );
      const encryptedBuffer = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)));
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encryptedBuffer
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption failed:', e);
      return '';
    }
  }
}