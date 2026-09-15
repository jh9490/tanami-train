type CryptoLike = {
  getRandomValues?: (array: Uint8Array) => Uint8Array;
};

function randomBytes(): Uint8Array {
  const bytes = new Uint8Array(16);
  const cryptoObject = (globalThis as unknown as { crypto?: CryptoLike }).crypto;

  if (cryptoObject?.getRandomValues) {
    return cryptoObject.getRandomValues(bytes);
  }

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/** Generate an opaque UUID v4 for one explicit onboarding Start gesture. */
export function createIdempotencyKey(): string {
  const bytes = randomBytes();
  // UUID version/variant flags are defined as bit masks.
  // eslint-disable-next-line no-bitwise
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // eslint-disable-next-line no-bitwise
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-');
}
