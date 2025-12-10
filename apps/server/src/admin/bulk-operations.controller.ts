import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BulkOperationsService, BulkActionPayload } from './bulk-operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';

@ApiTags('admin/bulk-operations')
@Controller('admin/bulk-operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class BulkOperationsController {
    constructor(private readonly bulkOperationsService: BulkOperationsService) { }

    @Post('kyc/review')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk review KYC documents (approve/reject)' })
    async bulkReviewKYC(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkReviewKYCDocuments(userId, payload);
    }

    @Post('transactions/review')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk review transactions (approve/reject)' })
    async bulkReviewTransactions(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkReviewTransactions(userId, payload);
    }

    @Post('kyc/flag')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk flag KYC documents for manual review' })
    async bulkFlagKYC(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkFlagItems(
            userId,
            'kyc_documents',
            payload,
        );
    }

    @Post('transactions/flag')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk flag transactions for manual review' })
    async bulkFlagTransactions(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkFlagItems(
            userId,
            'transactions',
            payload,
        );
    }

    @Post('kyc/delete')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk soft-delete KYC documents' })
    async bulkDeleteKYC(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkDeleteItems(
            userId,
            'kyc_documents',
            payload,
        );
    }

    @Post('transactions/delete')
    @HttpCode(200)
    @ApiOperation({ summary: 'Bulk soft-delete transactions' })
    async bulkDeleteTransactions(
        @Req() req: Request & { user?: { id?: string } },
        @Body() payload: BulkActionPayload,
    ) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkDeleteItems(
            userId,
            'transactions',
            payload,
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get bulk operation statistics' })
    async getStats() {
        return this.bulkOperationsService.getBulkOperationStats();
    }
}
