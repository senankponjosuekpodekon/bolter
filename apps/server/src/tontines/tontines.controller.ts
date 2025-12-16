import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TontinesService } from './tontines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  CreateTontineDto,
  UpdateTontineDto,
  AddMemberDto,
  RecordContributionDto,
  CreateInvitationDto,
  ApplyToTontineDto,
  ReviewApplicationDto,
} from './tontines.types';

@ApiTags('tontines')
@Controller('tontines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TontinesController {
  constructor(private readonly tontinesService: TontinesService) { }

  /**
   * Create a new tontine
   */
  @Post()
  @ApiOperation({ summary: 'Create a new tontine' })
  async create(@Req() req: Record<string, unknown>, @Body() dto: CreateTontineDto) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.createTontine(userId, dto);
  }

  /**
   * Get all tontines for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all tontines for the current user' })
  async getUserTontines(@Req() req: Record<string, unknown>) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getUserTontines(userId);
  }

  /**
   * Get tontine by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get tontine details' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async getTontine(@Req() req: Record<string, unknown>, @Param('id') tontineId: string) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getTontine(tontineId, userId);
  }

  /**
   * Update tontine
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update tontine details' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async updateTontine(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Body() dto: UpdateTontineDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.updateTontine(tontineId, userId, dto);
  }

  /**
   * Start tontine (begin first cycle)
   */
  @Post(':id/start')
  @ApiOperation({ summary: 'Start tontine and create first cycle' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async startTontine(@Req() req: Record<string, unknown>, @Param('id') tontineId: string) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.startTontine(tontineId, userId);
  }

  /**
   * Add member to tontine
   */
  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to tontine' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async addMember(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Body() dto: AddMemberDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.addMember(tontineId, userId, dto);
  }

  /**
   * Get tontine members
   */
  @Get(':id/members')
  @ApiOperation({ summary: 'Get tontine members' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async getMembers(@Req() req: Record<string, unknown>, @Param('id') tontineId: string) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getMembers(tontineId, userId);
  }

  /**
   * Record contribution payment
   */
  @Post(':id/contributions')
  @ApiOperation({ summary: 'Record a contribution payment' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async recordContribution(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Body() dto: RecordContributionDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.recordContribution(tontineId, userId, dto);
  }

  /**
   * Get tontine statistics
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get tontine statistics' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async getStatistics(@Req() req: Record<string, unknown>, @Param('id') tontineId: string) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getTontineStatistics(tontineId, userId);
  }

  /**
   * Get member statistics
   */
  @Get(':id/members/:memberId/statistics')
  @ApiOperation({ summary: 'Get member statistics in tontine' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async getMemberStatistics(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Param('memberId') memberId: string,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getMemberStatistics(tontineId, memberId, userId);
  }

  /**
   * Create invitation code
   */
  @Post(':id/invitations')
  @ApiOperation({ summary: 'Create invitation code for tontine' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async createInvitation(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.createInvitation(tontineId, userId, dto);
  }

  /**
   * Get tontine by invitation code (public)
   */
  @Get('invite/:code')
  @ApiOperation({ summary: 'Get tontine details by invitation code' })
  @ApiParam({ name: 'code', description: 'Invitation code' })
  @UseGuards(OptionalJwtAuthGuard)
  async getTontineByInviteCode(@Param('code') code: string) {
    return this.tontinesService.getTontineByInviteCode(code);
  }

  /**
   * Apply to join tontine
   */
  @Post('invite/:code/apply')
  @ApiOperation({ summary: 'Apply to join tontine via invitation' })
  @ApiParam({ name: 'code', description: 'Invitation code' })
  async applyToTontine(
    @Req() req: Record<string, unknown>,
    @Param('code') code: string,
    @Body() dto: ApplyToTontineDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.applyToTontine(code, userId, dto);
  }

  /**
   * Get applications for tontine
   */
  @Get(':id/applications')
  @ApiOperation({ summary: 'Get applications for tontine' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  async getApplications(@Req() req: Record<string, unknown>, @Param('id') tontineId: string) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.getApplications(tontineId, userId);
  }

  /**
   * Review application
   */
  @Post(':id/applications/:applicationId/review')
  @ApiOperation({ summary: 'Approve or reject application' })
  @ApiParam({ name: 'id', description: 'Tontine ID' })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  async reviewApplication(
    @Req() req: Record<string, unknown>,
    @Param('id') tontineId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    const userId = (req.user as Record<string, unknown>)?.id as string;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tontinesService.reviewApplication(tontineId, applicationId, userId, dto);
  }
}
