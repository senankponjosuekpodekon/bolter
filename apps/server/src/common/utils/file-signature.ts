import { BadRequestException } from '@nestjs/common';

/**
 * Magic-bytes validation for uploaded files. The client-supplied mimetype is
 * untrusted — verify the actual file signature before storing anything.
 */
const SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

export function assertFileSignature(buffer: Buffer, mimetype: string): void {
  if (!buffer || buffer.length < 12) {
    throw new BadRequestException('File is empty or too small');
  }

  // WebP: RIFF....WEBP container
  if (mimetype === 'image/webp') {
    const isWebp =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (!isWebp) {
      throw new BadRequestException('File content does not match its declared type');
    }
    return;
  }

  const expected = SIGNATURES[mimetype];
  if (!expected || !expected.every((b, i) => buffer[i] === b)) {
    throw new BadRequestException('File content does not match its declared type');
  }
}
