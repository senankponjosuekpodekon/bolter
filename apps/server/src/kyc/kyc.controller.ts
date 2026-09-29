import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { KycFilterService } from './kyc-filter.service';
import { KycStorageService } from './kyc-storage.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { KycFilterDto } from './dto/kyc-filter.dto';
import { UploadRateLimitService } from '../common/services/upload-rate-limit.service';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { assertFileSignature } from '../common/utils/file-signature';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly kycFilterService: KycFilterService,
    private readonly kycStorageService: KycStorageService,
    private readonly uploadRateLimit: UploadRateLimitService,
    private readonly storageMonitoring: StorageMonitoringService,
  ) { }

  @Post('documents')
  @ApiOperation({ summary: 'Upload KYC document' })
  uploadDocument(@Req() req: Request & { user?: { id?: string } }, @Body() uploadDto: UploadKycDocumentDto) {
    return this.kycService.uploadDocument(req.user?.id ?? 'unknown', uploadDto);
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed: JPEG, PNG, PDF`), false);
      }
    }
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC document file' })
  async uploadFile(
    @Req() req: Request & { user?: { id?: string } },
    @UploadedFile() file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
    @Body('documentType') documentType: string,
  ) {
    const userId = req.user?.id ?? 'unknown';

    // Magic-bytes check: the client-supplied mimetype is untrusted — verify
    // the file signature actually matches JPEG/PNG/PDF.
    assertFileSignature(file.buffer, file.mimetype);

    // Check per-user upload rate limit (10 uploads/hour)
    await this.uploadRateLimit.recordUpload(userId);

    try {
      // Upload to storage and get path/url
      const { path } = await this.kycStorageService.uploadDocument(
        userId,
        documentType,
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      // Save document record in database
      const result = await this.kycService.uploadDocument(userId, {
        documentType,
        filePath: path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Log successful upload to monitoring
      await this.storageMonitoring.logUploadAttempt(userId, 'kyc-documents', file.size, true);

      return {
        ...result,
        remaining: this.uploadRateLimit.getRemainingUploads(userId),
      };
    } catch (error) {
      // Log failed upload to monitoring
      await this.storageMonitoring.logUploadAttempt(userId, 'kyc-documents', file.size || 0, false, error.message);
      throw error;
    }
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get user KYC documents' })
  getUserDocuments(@Req() req: Request & { user?: { id?: string } }) {
    return this.kycService.findByUserId(req.user?.id ?? 'unknown');
  }

  @Get('documents/pending')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get pending KYC documents (Admin only)' })
  getPendingDocuments() {
    return this.kycService.findPendingDocuments();
  }

  @Get('documents/:id/view')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get signed URL to view KYC document (Admin only)' })
  async viewDocument(@Param('id') documentId: string) {
    const document = await this.kycService.getDocumentById(documentId);
    const signedUrl = await this.kycStorageService.getDocumentUrl(document.file_path);
    return {
      id: document.id,
      documentType: document.document_type,
      fileName: document.file_path.split('/').pop(),
      url: signedUrl,
      uploadedAt: document.created_at,
      status: document.status,
    };
  }

  @Get('documents/:id/download')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Download KYC document (Admin only)' })
  async downloadDocument(@Param('id') documentId: string, @Res() res: Response) {
    const document = await this.kycService.getDocumentById(documentId);
    const fileBuffer = await this.kycStorageService.downloadDocument(document.file_path);

    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_path.split('/').pop()}"`);
    res.send(fileBuffer);
  }

  @Patch('documents/:id/review')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Review KYC document (Admin only)' })
  reviewDocument(@Req() req: Request & { user?: { id?: string } }, @Param('id') id: string, @Body() reviewDto: ReviewKycDocumentDto) {
    return this.kycService.reviewDocument(req.user?.id ?? 'unknown', id, reviewDto);
  }

  @Get('applications/filter')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Filter KYC applications (Admin only)' })
  filterApplications(@Query() query: KycFilterDto) {
    return this.kycFilterService.filter(query);
  }
}
