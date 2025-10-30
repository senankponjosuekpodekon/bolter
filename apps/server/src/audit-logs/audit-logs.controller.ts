import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    @Roles('ADMIN', 'COMPLIANCE')
    @ApiOperation({ summary: 'List audit logs (Admin only)' })
    findAll(@Query() query: QueryAuditLogsDto) {
        return this.auditLogsService.findAll(query);
    }

    @Get('me')
    @Roles('ADMIN', 'COMPLIANCE')
    @ApiOperation({ summary: 'List audit logs performed by current admin' })
    findMine(@Req() req, @Query() query: QueryAuditLogsDto) {
        query.performedBy = req.user.id;
        return this.auditLogsService.findAll(query);
    }
}
