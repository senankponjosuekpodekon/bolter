import { Injectable } from '@nestjs/common';

export interface UploadAvatarResult {
  url: string;
  path: string;
}

@Injectable()
export class AvatarService {
  async upload(userId: string, file: Express.Multer.File): Promise<UploadAvatarResult> {
    // TODO: validate MIME/size, push to Supabase, generate signed URL, log audit
    throw new Error('NotImplemented');
  }

  async get(userId: string): Promise<string> {
    // TODO: return signed URL or public path
    throw new Error('NotImplemented');
  }

  async delete(userId: string): Promise<void> {
    // TODO: delete current avatar file(s) for user
    throw new Error('NotImplemented');
  }
}
