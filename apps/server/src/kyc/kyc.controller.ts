import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) { }

  @Post('documents')
  @ApiOperation({ summary: 'Upload KYC document' })
  uploadDocument(@Req() req: Request & { user?: { id?: string } }, @Body() uploadDto: UploadKycDocumentDto) {
    return this.kycService.uploadDocument(req.user?.id ?? 'unknown', uploadDto);
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

  @Patch('documents/:id/review')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Review KYC document (Admin only)' })
  reviewDocument(@Req() req: Request & { user?: { id?: string } }, @Param('id') id: string, @Body() reviewDto: ReviewKycDocumentDto) {
    return this.kycService.reviewDocument(req.user?.id ?? 'unknown', id, reviewDto);
  }
}
