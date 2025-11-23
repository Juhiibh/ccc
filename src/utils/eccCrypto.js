// src/utils/eccCrypto.js
import EC from "elliptic";
const ec = new EC.ec("secp256k1");

/*
ECIES-style helper:
- generateKeyPair(): { priv, pub } (hex)
- encryptTo(recipientPubHex, plaintext): returns { ephemeralPub, iv, ct } (iv/ct are base64)
- decryptWith(recipientPrivHex, cipher): returns plaintext string

Uses window.crypto.subtle for AES-GCM and SHA-256.
This is suitable for demo/presentation. For production, use server-side key management.
*/

function hexToUint8(hex) {
  if (!hex) return new Uint8Array();
  if (hex.length % 2) hex = "0" + hex;
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
}
function uint8ToHex(u8) {
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function sha256(buffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(hash);
}

async function deriveAesKeyFromSharedSecret(sharedHex) {
  // sharedHex is hex string; convert to ArrayBuffer
  const shared = hexToUint8(sharedHex);
  // Derive using SHA-256 of shared secret
  const hash = await sha256(shared.buffer);
  // Import as AES-GCM key
  return crypto.subtle.importKey(
    "raw",
    hash.buffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function generateKeyPair() {
  const kp = ec.genKeyPair();
  const priv = kp.getPrivate("hex");
  const pub = kp.getPublic("hex"); // uncompressed hex
  return { priv, pub };
}

/*
Encrypt to recipient public key (hex):
Returns { ephemeralPub, iv: base64, ct: base64 }
ephemeralPub is hex (uncompressed)
*/
export async function encryptTo(recipientPubHex, plaintext) {
  // make ephemeral key pair
  const eph = ec.genKeyPair();
  const ephPub = eph.getPublic("hex");

  // recipient public key object
  const recip = ec.keyFromPublic(recipientPubHex, "hex");

  // ECDH: derive shared secret (BN) -> hex
  const shared = eph.derive(recip.getPublic()); // BN
  const sharedHex = shared.toString(16);

  // derive AES key
  const aesKey = await deriveAesKeyFromSharedSecret(sharedHex);

  // generate iv
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit
  const enc = new TextEncoder().encode(plaintext);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    enc
  );

  return {
    ephemeralPub: ephPub, // hex
    iv: bufToBase64(iv.buffer),
    ct: bufToBase64(cipherBuf),
  };
}

/*
Decrypt with recipient private key (hex).
cipher = { ephemeralPub, iv (base64), ct (base64) }
*/
export async function decryptWith(recipientPrivHex, cipher) {
  try {
    const recipient = ec.keyFromPrivate(recipientPrivHex, "hex");
    const eph = ec.keyFromPublic(cipher.ephemeralPub, "hex");
    const shared = recipient.derive(eph.getPublic()); // BN
    const sharedHex = shared.toString(16);
    const aesKey = await deriveAesKeyFromSharedSecret(sharedHex);

    const ivBuf = base64ToBuf(cipher.iv);
    const ctBuf = base64ToBuf(cipher.ct);

    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
      aesKey,
      ctBuf
    );
    const dec = new TextDecoder().decode(plainBuf);
    return dec;
  } catch (err) {
    console.error("Decrypt error:", err);
    throw err;
  }
}
