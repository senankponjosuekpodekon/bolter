import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

export interface UploadAvatarResult {
  url: string;
  path: string;
}

@Injectable()
export class AvatarService {
  private readonly bucket = 'profile-avatars';
  private readonly maxBytes = 2 * 1024 * 1024; // 2MB
  private readonly allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);

  constructor(private readonly supabase: SupabaseService) { }

  async upload(
    userId: string,
    file: { mimetype: string; size: number; buffer: Buffer }
  ): Promise<UploadAvatarResult> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!this.allowedMime.has(file.mimetype)) throw new BadRequestException('Unsupported file type');
    if (file.size > this.maxBytes) throw new BadRequestException('File too large');

    const checksum = createHash('sha256').update(file.buffer).digest('hex').slice(0, 16);
    const ext = this.getExt(file.mimetype);
    const base = `avatar_${Date.now()}_${checksum}`;
    const standardPath = `${userId}/${base}_standard.${ext}`;
    const thumbPath = `${userId}/${base}_thumb.${ext}`;

    const sharp = this.tryLoadSharp();
    if (!sharp) {
      // Fallback: store original buffer if sharp is not available
      const { data, error } = await this.supabase
        .getClient()
        .storage.from(this.bucket)
        .upload(standardPath, file.buffer, { contentType: file.mimetype, upsert: true });
      if (error) throw new BadRequestException(error.message);
      const signed = await this.getSignedUrl(standardPath, 3600);
      return { url: signed, path: data?.path || standardPath };
    }

    // Resize to standard and thumbnail sizes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standardBuffer = await (sharp as any)(file.buffer).resize(512, 512, { fit: 'cover' }).toFormat(ext).toBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbBuffer = await (sharp as any)(file.buffer).resize(128, 128, { fit: 'cover' }).toFormat(ext).toBuffer();

    const uploads = [
      { path: standardPath, buffer: standardBuffer },
      { path: thumbPath, buffer: thumbBuffer },
    ];

    for (const upload of uploads) {
      const { error } = await this.supabase
        .getClient()
        .storage.from(this.bucket)
        .upload(upload.path, upload.buffer, { contentType: file.mimetype, upsert: true });
      if (error) throw new BadRequestException(error.message);
    }

    const signed = await this.getSignedUrl(standardPath, 3600);
    return { url: signed, path: standardPath };
  }

  async get(userId: string): Promise<string> {
    // Prefer the latest avatar file in user's folder
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(this.bucket)
      .list(userId, { sortBy: { column: 'name', order: 'desc' } });
    if (error) throw new BadRequestException(error.message);
    if (!data || data.length === 0) throw new BadRequestException('No avatar found');
    const preferred = data.find((f) => f.name.includes('_standard.'))?.name || data[0].name;
    const path = `${userId}/${preferred}`;
    return this.getSignedUrl(path, 3600);
  }

  async delete(userId: string): Promise<void> {
    const { data, error } = await this.supabase.getClient().storage.from(this.bucket).list(userId);
    if (error) throw new BadRequestException(error.message);
    const paths = (data || []).map((f) => `${userId}/${f.name}`);
    if (!paths.length) return;
    const del = await this.supabase.getClient().storage.from(this.bucket).remove(paths);
    if (del.error) throw new BadRequestException(del.error.message);
  }

  private async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(this.bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw new BadRequestException(error.message);
    return data?.signedUrl as string;
  }

  private getExt(mime: string): string {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'bin';
  }

  private tryLoadSharp(): NodeRequire | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
      return require('sharp');
    } catch {
      return null;
    }
  }
}
