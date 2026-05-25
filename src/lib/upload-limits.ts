export const MAX_MASTER_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isLikelyPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}
