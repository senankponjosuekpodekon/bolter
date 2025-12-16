"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
let AvatarService = class AvatarService {
    constructor(supabase) {
        this.supabase = supabase;
        this.bucket = 'profile-avatars';
        this.maxBytes = 2 * 1024 * 1024;
        this.allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
    }
    async upload(userId, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (!this.allowedMime.has(file.mimetype))
            throw new common_1.BadRequestException('Unsupported file type');
        if (file.size > this.maxBytes)
            throw new common_1.BadRequestException('File too large');
        const checksum = (0, crypto_1.createHash)('sha256').update(file.buffer).digest('hex').slice(0, 16);
        const ext = this.getExt(file.mimetype);
        const base = `avatar_${Date.now()}_${checksum}`;
        const standardPath = `${userId}/${base}_standard.${ext}`;
        const thumbPath = `${userId}/${base}_thumb.${ext}`;
        const sharp = this.tryLoadSharp();
        if (!sharp) {
            const { data, error } = await this.supabase
                .getClient()
                .storage.from(this.bucket)
                .upload(standardPath, file.buffer, { contentType: file.mimetype, upsert: true });
            if (error)
                throw new common_1.BadRequestException(error.message);
            const signed = await this.getSignedUrl(standardPath, 3600);
            return { url: signed, path: data?.path || standardPath };
        }
        const standardBuffer = await sharp(file.buffer).resize(512, 512, { fit: 'cover' }).toFormat(ext).toBuffer();
        const thumbBuffer = await sharp(file.buffer).resize(128, 128, { fit: 'cover' }).toFormat(ext).toBuffer();
        const uploads = [
            { path: standardPath, buffer: standardBuffer },
            { path: thumbPath, buffer: thumbBuffer },
        ];
        for (const upload of uploads) {
            const { error } = await this.supabase
                .getClient()
                .storage.from(this.bucket)
                .upload(upload.path, upload.buffer, { contentType: file.mimetype, upsert: true });
            if (error)
                throw new common_1.BadRequestException(error.message);
        }
        const signed = await this.getSignedUrl(standardPath, 3600);
        return { url: signed, path: standardPath };
    }
    async get(userId) {
        const { data, error } = await this.supabase
            .getClient()
            .storage.from(this.bucket)
            .list(userId, { sortBy: { column: 'name', order: 'desc' } });
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data || data.length === 0)
            throw new common_1.BadRequestException('No avatar found');
        const preferred = data.find((f) => f.name.includes('_standard.'))?.name || data[0].name;
        const path = `${userId}/${preferred}`;
        return this.getSignedUrl(path, 3600);
    }
    async delete(userId) {
        const { data, error } = await this.supabase.getClient().storage.from(this.bucket).list(userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        const paths = (data || []).map((f) => `${userId}/${f.name}`);
        if (!paths.length)
            return;
        const del = await this.supabase.getClient().storage.from(this.bucket).remove(paths);
        if (del.error)
            throw new common_1.BadRequestException(del.error.message);
    }
    async getSignedUrl(path, expiresIn) {
        const { data, error } = await this.supabase
            .getClient()
            .storage.from(this.bucket)
            .createSignedUrl(path, expiresIn);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data?.signedUrl;
    }
    getExt(mime) {
        if (mime === 'image/jpeg')
            return 'jpg';
        if (mime === 'image/png')
            return 'png';
        if (mime === 'image/webp')
            return 'webp';
        return 'bin';
    }
    tryLoadSharp() {
        try {
            return require('sharp');
        }
        catch {
            return null;
        }
    }
};
exports.AvatarService = AvatarService;
exports.AvatarService = AvatarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AvatarService);
//# sourceMappingURL=avatar.service.js.map