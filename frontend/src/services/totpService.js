/**
 * TOTP & QR Code Service (RFC 6238 compliant)
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
 */
import QRCode from 'qrcode';
import api from './api';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const totpService = {
  /**
   * Generate a random 16-character Base32 secret key.
   */
  generateSecret() {
    let secret = '';
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < 16; i++) {
      secret += BASE32_CHARS[array[i] % 32];
    }
    return secret;
  },

  /**
   * Generate standard otpauth:// URI for authenticator apps.
   */
  getOtpAuthUri(email, secret) {
    const cleanEmail = email ? email.trim() : 'user@prophetval.ai';
    const label = encodeURIComponent(`ProphetVal:${cleanEmail}`);
    const issuer = encodeURIComponent('ProphetVal');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  },

  /**
   * Generate real, high-contrast scannable QR Code as PNG Data URL.
   */
  async generateQRCodeDataUrl(otpAuthUri) {
    try {
      const dataUrl = await QRCode.toDataURL(otpAuthUri, {
        width: 200,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      return dataUrl;
    } catch (err) {
      console.error('Error generating QR code', err);
      // Fallback to trusted QR service if canvas rendering fails
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUri)}`;
    }
  },

  /**
   * Verify TOTP code via backend FastAPI endpoint or client-side RFC 6238 check.
   */
  async verifyCode(secret, code) {
    const cleanCode = (code || '').trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) return false;

    // 1. First try backend verification
    try {
      const res = await api.verifyTotp(secret, cleanCode);
      if (res && typeof res.valid === 'boolean') {
        return res.valid;
      }
    } catch (err) {
      console.warn('Backend TOTP check unavailable, checking client-side RFC 6238...', err);
    }

    // 2. Client-side RFC 6238 fallback using Web Crypto API
    return this.verifyClientSideTotp(secret, cleanCode);
  },

  /**
   * Client-side Web Crypto RFC 6238 TOTP verification (supports +-30s window).
   */
  async verifyClientSideTotp(secret, codeToVerify) {
    try {
      const keyBytes = this.base32Decode(secret);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const timeStep = 30;
      const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

      // Check window: current, -1 step (-30s), +1 step (+30s)
      for (let offset = -1; offset <= 1; offset++) {
        const counter = currentCounter + offset;
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigUint64(0, BigInt(counter));

        const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
        const sigBytes = new Uint8Array(signature);
        const dynamicOffset = sigBytes[sigBytes.length - 1] & 0x0f;

        const binary =
          ((sigBytes[dynamicOffset] & 0x7f) << 24) |
          ((sigBytes[dynamicOffset + 1] & 0xff) << 16) |
          ((sigBytes[dynamicOffset + 2] & 0xff) << 8) |
          (sigBytes[dynamicOffset + 3] & 0xff);

        const calculatedOtp = (binary % 1000000).toString().padStart(6, '0');
        if (calculatedOtp === codeToVerify) {
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Error verifying client-side TOTP', e);
      return false;
    }
  },

  /**
   * Helper to decode Base32 string to Uint8Array.
   */
  base32Decode(base32) {
    const clean = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < clean.length; i++) {
      const val = BASE32_CHARS.indexOf(clean[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    return new Uint8Array(bytes);
  }
};

export default totpService;

