import { Controller, Post, Get, Delete, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarService } from './avatar.service';

@Controller('profile/avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user?.id || req.user?.sub;
    // TODO: enforce JwtVerifiedGuard
    return this.avatarService.upload(userId, file);
  }

  @Get()
  async get(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return { url: await this.avatarService.get(userId) };
  }

  @Delete()
  async remove(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    await this.avatarService.delete(userId);
    return { success: true };
  }
}
