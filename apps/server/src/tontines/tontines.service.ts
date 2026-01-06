import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  Tontine,
  TontineMember,
  TontineCycle,
  TontineContribution,
  TontineStatus,
  DistributionMethod,
  CreateTontineDto,
  UpdateTontineDto,
  AddMemberDto,
  RecordContributionDto,
  MemberStatistics,
  TontineInvitation,
  TontineApplication,
  CreateInvitationDto,
  ApplyToTontineDto,
  ReviewApplicationDto,
} from './tontines.types';
import { PayTontineDto } from './dto/pay-tontine.dto';

@Injectable()
export class TontinesService {
  private readonly logger = new Logger(TontinesService.name);

  constructor(
    private supabase: SupabaseService,
    private auditLogs: AuditLogsService,
  ) { }

  /**
   * Create a new tontine
   */
  async createTontine(userId: string, dto: CreateTontineDto): Promise<Tontine> {
    // Verify user KYC status before allowing tontine creation
    await this.ensureUserEligible(userId);

    if (dto.total_cycles < 1) {
      throw new BadRequestException('Total cycles must be at least 1');
    }
    if (dto.contribution_amount <= 0) {
      throw new BadRequestException('Contribution amount must be positive');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontines')
      .insert({
        creator_id: userId,
        name: dto.name,
        description: dto.description,
        contribution_amount: dto.contribution_amount,
        currency: dto.currency || 'EUR',
        frequency: dto.frequency,
        total_cycles: dto.total_cycles,
        cycle_duration_days: dto.cycle_duration_days,
        distribution_method: dto.distribution_method || DistributionMethod.SENIORITY,
        status: TontineStatus.PENDING,
        late_payment_penalty_percent: dto.late_payment_penalty_percent || 0,
        withdrawal_allowed: dto.withdrawal_allowed || false,
        withdrawal_penalty_percent: dto.withdrawal_penalty_percent || 10,
        metadata: dto.metadata || {},
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to create tontine: ${error.message}`);

    await this.auditLogs.log({
      action: 'tontine.created',
      resourceType: 'tontine',
      resourceId: data.id,
      userId,
      metadata: { name: data.name },
    });

    // Optionally add initial members
    if (dto.initial_members && Array.isArray(dto.initial_members) && dto.initial_members.length > 0) {
      // Prevent duplicates within the same payload
      const seen = new Set<string>();
      const sanitized = dto.initial_members.filter((m) => {
        if (!m?.user_id) return false;
        if (seen.has(m.user_id)) return false;
        seen.add(m.user_id);
        return true;
      });

      if (sanitized.length > 0) {
        const membersToInsert = sanitized.map((m) => ({
          tontine_id: data.id,
          user_id: m.user_id,
          distribution_order: m.distribution_order,
          phone_number: m.phone_number,
          email_notification: m.email_notification !== false,
          sms_notification: m.sms_notification || false,
          total_expected: data.contribution_amount * data.total_cycles,
        }));

        const { error: bulkError } = await this.supabase
          .getAdminClient()
          .from('tontine_members')
          .insert(membersToInsert);

        if (bulkError) {
          this.logger.error(`Failed to insert initial members: ${bulkError.message}`);
          // Do not fail creation; just log. Optionally we could throw a BadRequest.
        }
      }
    }

    return data;
  }

  /**
   * Get tontine by ID
   */
  async getTontine(tontineId: string, userId: string): Promise<Tontine> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontines')
      .select()
      .eq('id', tontineId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Tontine not found');
    }

    // Check authorization
    const isMember = await this.isMember(tontineId, userId);
    if (data.creator_id !== userId && !isMember) {
      throw new ForbiddenException('You do not have access to this tontine');
    }

    return data;
  }

  /**
   * Get all tontines for a user
   */
  async getUserTontines(userId: string): Promise<Tontine[]> {
    const client = this.supabase.getAdminClient();

    // Fetch tontines created by the user
    const { data: createdByUser, error: creatorError } = await client
      .from('tontines')
      .select()
      .eq('creator_id', userId);

    if (creatorError) {
      this.logger.error(`Failed to fetch creator tontines: ${creatorError.message}`);
      throw new BadRequestException(`Failed to fetch tontines: ${creatorError.message}`);
    }

    // Fetch membership rows to build a clean list of tontine ids where the user is a member
    const { data: memberLinks, error: memberError } = await client
      .from('tontine_members')
      .select('tontine_id')
      .eq('user_id', userId);

    if (memberError) {
      this.logger.error(`Failed to fetch tontine memberships: ${memberError.message}`);
      throw new BadRequestException(`Failed to fetch tontines: ${memberError.message}`);
    }

    const memberIds = (memberLinks || [])
      .map((m) => m.tontine_id)
      .filter((id): id is string => Boolean(id));

    let memberTontines: Tontine[] = [];
    if (memberIds.length > 0) {
      const { data: fetchedMembers, error: memberTontinesError } = await client
        .from('tontines')
        .select()
        .in('id', memberIds);

      if (memberTontinesError) {
        this.logger.error(`Failed to fetch member tontines: ${memberTontinesError.message}`);
        throw new BadRequestException(`Failed to fetch tontines: ${memberTontinesError.message}`);
      }

      memberTontines = fetchedMembers || [];
    }

    // Merge and deduplicate by id, then sort by created_at desc for a predictable order
    const combined = [...(createdByUser || []), ...memberTontines];
    const deduped = Array.from(new Map(combined.map((t) => [t.id, t])).values());

    return deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Update tontine
   */
  async updateTontine(tontineId: string, userId: string, dto: UpdateTontineDto): Promise<Tontine> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can update the tontine');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontines')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tontineId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update tontine: ${error.message}`);

    await this.auditLogs.log({
      action: 'tontine.updated',
      resourceType: 'tontine',
      resourceId: tontineId,
      userId,
      metadata: { changes: dto },
    });

    return data;
  }

  /**
   * Add member to tontine
   */
  async addMember(tontineId: string, userId: string, dto: AddMemberDto): Promise<TontineMember> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can add members');
    }

    if (tontine.status !== TontineStatus.PENDING) {
      throw new BadRequestException('Members can only be added while the tontine is pending');
    }

    // Check if already a member
    const { data: existingMember } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .select()
      .eq('tontine_id', tontineId)
      .eq('user_id', dto.user_id)
      .single();

    if (existingMember) {
      throw new BadRequestException('User is already a member of this tontine');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .insert({
        tontine_id: tontineId,
        user_id: dto.user_id,
        distribution_order: dto.distribution_order,
        phone_number: dto.phone_number,
        email_notification: dto.email_notification !== false,
        sms_notification: dto.sms_notification || false,
        total_expected: tontine.contribution_amount * tontine.total_cycles,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to add member: ${error.message}`);

    await this.auditLogs.log({
      action: 'tontine.member_added',
      resourceType: 'tontine_member',
      resourceId: data.id,
      userId,
      metadata: { tontineId, newMemberId: dto.user_id },
    });

    return data;
  }

  /**
   * Get tontine members
   */
  async getMembers(tontineId: string, userId: string): Promise<TontineMember[]> {
    await this.getTontine(tontineId, userId); // Check authorization

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .select()
      .eq('tontine_id', tontineId)
      .order('joined_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch members: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Start tontine (create first cycle)
   */
  async startTontine(tontineId: string, userId: string): Promise<TontineCycle> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can start the tontine');
    }

    if (tontine.status === TontineStatus.ACTIVE) {
      throw new BadRequestException('Tontine is already active');
    }

    // Get members
    const members = await this.getMembers(tontineId, userId);
    if (members.length < 2) {
      throw new BadRequestException('At least 2 members are required to start a tontine');
    }

    // Create first cycle
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + tontine.cycle_duration_days);

    const { data: cycle, error: cycleError } = await this.supabase
      .getAdminClient()
      .from('tontine_cycles')
      .insert({
        tontine_id: tontineId,
        cycle_number: 1,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (cycleError) throw new BadRequestException(`Failed to create cycle: ${cycleError.message}`);

    // Create contribution records for all members
    const contributions = members.map((member) => ({
      tontine_id: tontineId,
      member_id: member.id,
      cycle_id: cycle.id,
      amount: tontine.contribution_amount,
      currency: tontine.currency,
      status: 'PENDING',
    }));

    const { error: contributionError } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .insert(contributions);

    if (contributionError) {
      this.logger.error(`Failed to create contributions: ${contributionError.message}`);
    }

    // Update tontine status
    await this.supabase
      .getAdminClient()
      .from('tontines')
      .update({
        status: TontineStatus.ACTIVE,
        current_cycle: 1,
        started_at: now.toISOString(),
      })
      .eq('id', tontineId);

    await this.auditLogs.log({
      action: 'tontine.started',
      resourceType: 'tontine',
      resourceId: tontineId,
      userId,
    });

    return cycle;
  }

  /**
   * Pay tontine contribution (by member)
   */
  async payTontine(tontineId: string, userId: string, dto: PayTontineDto): Promise<TontineContribution> {
    const tontine = await this.getTontine(tontineId, userId);

    // Verify user is a member
    const isMember = await this.isMember(tontineId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this tontine to make payments');
    }

    // Get member record
    const { data: member, error: memberError } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .select()
      .eq('tontine_id', tontineId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      throw new NotFoundException('Member record not found');
    }

    // Verify member is active
    if (member.status !== 'ACTIVE') {
      throw new ForbiddenException('Your membership is not active');
    }

    // Get contribution record for this cycle
    const { data: contribution, error: getError } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .select()
      .eq('tontine_id', tontineId)
      .eq('member_id', member.id)
      .eq('cycle_id', dto.cycle_id)
      .single();

    if (getError || !contribution) {
      throw new NotFoundException('Contribution record not found for this cycle');
    }

    // Check if already paid
    if (contribution.status === 'PAID') {
      throw new BadRequestException('This contribution has already been paid');
    }

    // Validate amount matches expected contribution
    if (dto.amount !== tontine.contribution_amount) {
      throw new BadRequestException(`Payment amount must be exactly ${tontine.contribution_amount} ${tontine.currency}`);
    }

    // TODO: Integrate with actual payment gateway (Stripe, etc.)
    // For now, we'll mark it as PAID immediately
    // In production, this would be PENDING until payment confirmation

    const now = new Date();
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .update({
        amount: dto.amount,
        status: 'PAID',
        paid_at: now.toISOString(),
        payment_method: dto.payment_method,
        payment_reference: dto.payment_reference,
        proof: dto.proof,
      })
      .eq('id', contribution.id)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to process payment: ${error.message}`);

    // Update member's total contributed
    await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .update({
        total_contributed: member.total_contributed + dto.amount,
      })
      .eq('id', member.id);

    // Log payment
    await this.auditLogs.log({
      action: 'tontine.payment_made',
      resourceType: 'tontine_contribution',
      resourceId: data.id,
      userId,
      metadata: { 
        amount: dto.amount, 
        tontineId,
        cycleId: dto.cycle_id,
        paymentMethod: dto.payment_method,
      },
    });

    // TODO: Send WebSocket notification to other members
    // websocketService.emitToRoom(`tontine:${tontineId}`, 'payment_received', { ... })

    return data;
  }

  /**
   * Record a contribution payment (admin/creator only)
   */
  async recordContribution(tontineId: string, userId: string, dto: RecordContributionDto): Promise<TontineContribution> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can record contributions');
    }

    // Get contribution record
    const { data: contribution, error: getError } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .select()
      .eq('id', dto.member_id)
      .eq('cycle_id', dto.cycle_id)
      .single();

    if (getError || !contribution) {
      throw new NotFoundException('Contribution record not found');
    }

    // Update contribution
    const now = new Date();
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .update({
        amount: dto.amount,
        status: 'PAID',
        paid_at: now.toISOString(),
        payment_method: dto.payment_method,
        payment_reference: dto.payment_reference,
      })
      .eq('id', contribution.id)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to record contribution: ${error.message}`);

    // Update member's total contributed
    await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .update({
        total_contributed: contribution.total_contributed + dto.amount,
      })
      .eq('id', dto.member_id);

    await this.auditLogs.log({
      action: 'tontine.contribution_recorded',
      resourceType: 'tontine_contribution',
      resourceId: data.id,
      userId,
      metadata: { amount: dto.amount },
    });

    return data;
  }

  /**
   * Get tontine statistics
   */
  async getTontineStatistics(tontineId: string, userId: string): Promise<Record<string, unknown>> {
    const tontine = await this.getTontine(tontineId, userId);
    const members = await this.getMembers(tontineId, userId);

    // Get contributions
    const { data: contributions } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .select()
      .eq('tontine_id', tontineId);

    const totalContributed = (contributions || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    const paidCount = (contributions || []).filter((c) => c.status === 'PAID').length;

    return {
      tontine: {
        id: tontine.id,
        name: tontine.name,
        status: tontine.status,
        current_cycle: tontine.current_cycle,
        total_cycles: tontine.total_cycles,
      },
      members: {
        total: members.length,
        active: members.filter((m) => m.status === 'ACTIVE').length,
      },
      contributions: {
        expected: members.length * tontine.contribution_amount * (tontine.current_cycle || 1),
        collected: totalContributed,
        rate: members.length > 0 ? (paidCount / (members.length * (tontine.current_cycle || 1))) * 100 : 0,
      },
    };
  }

  /**
   * Get member statistics
   */
  async getMemberStatistics(tontineId: string, memberId: string, userId: string): Promise<MemberStatistics> {
    await this.getTontine(tontineId, userId);

    const { data: member, error } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .select()
      .eq('id', memberId)
      .eq('tontine_id', tontineId)
      .single();

    if (error || !member) {
      throw new NotFoundException('Member not found');
    }

    // Get contributions
    const { data: contributions } = await this.supabase
      .getAdminClient()
      .from('tontine_contributions')
      .select()
      .eq('member_id', memberId);

    const pending = (contributions || []).filter((c) => c.status === 'PENDING').length;
    const late = (contributions || []).filter((c) => c.status === 'LATE').length;

    return {
      total_contributed: member.total_contributed,
      total_expected: member.total_expected,
      contribution_rate: (member.total_contributed / member.total_expected) * 100,
      cycles_participated: contributions?.length || 0,
      times_received_distribution: member.has_received_distribution ? 1 : 0,
      pending_contributions: pending,
      late_contributions: late,
    };
  }

  /**
   * Check if user is a member of the tontine
   */
  private async isMember(tontineId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .getAdminClient()
      .from('tontine_members')
      .select()
      .eq('tontine_id', tontineId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Create invitation code for tontine
   */
  async createInvitation(tontineId: string, userId: string, dto: CreateInvitationDto): Promise<TontineInvitation> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can create invitations');
    }

    if (tontine.status !== TontineStatus.PENDING) {
      throw new BadRequestException('Invitations can only be created for pending tontines');
    }

    // Generate secure random code
    const code = this.generateInviteCode();
    const expiresAt = dto.expires_in_days
      ? new Date(Date.now() + dto.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_invitations')
      .insert({
        tontine_id: tontineId,
        code,
        created_by: userId,
        expires_at: expiresAt,
        max_uses: dto.max_uses,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to create invitation: ${error.message}`);

    await this.auditLogs.log({
      action: 'tontine.invitation_created',
      resourceType: 'tontine_invitation',
      resourceId: data.id,
      userId,
      metadata: { tontineId, code },
    });

    return data;
  }

  /**
   * Get tontine by invitation code (public access)
   */
  async getTontineByInviteCode(code: string): Promise<{ tontine: Tontine; invitation: TontineInvitation }> {
    const { data: invitation, error: inviteError } = await this.supabase
      .getAdminClient()
      .from('tontine_invitations')
      .select()
      .eq('code', code)
      .single();

    if (inviteError || !invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.revoked_at) {
      throw new BadRequestException('This invitation has been revoked');
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    if (invitation.max_uses && invitation.use_count >= invitation.max_uses) {
      throw new BadRequestException('This invitation has reached its maximum uses');
    }

    const { data: tontine, error: tontineError } = await this.supabase
      .getAdminClient()
      .from('tontines')
      .select()
      .eq('id', invitation.tontine_id)
      .single();

    if (tontineError || !tontine) {
      throw new NotFoundException('Tontine not found');
    }

    return { tontine, invitation };
  }

  /**
   * Apply to join tontine via invitation
   */
  async applyToTontine(code: string, userId: string, dto: ApplyToTontineDto): Promise<TontineApplication> {
    this.logger.warn(`[applyToTontine:START] code=${code}, userId=${userId}, message="${dto.message}"`);
    
    // Verify user KYC status before allowing application
    await this.ensureUserEligible(userId);
    
    const { tontine, invitation } = await this.getTontineByInviteCode(code);
    this.logger.warn(`[applyToTontine:FOUND_TONTINE] tontineId=${tontine.id}, status=${tontine.status}`);

    if (tontine.status !== TontineStatus.PENDING) {
      throw new BadRequestException('This tontine is not accepting applications');
    }

    // Check if already a member
    const isMember = await this.isMember(tontine.id, userId);
    if (isMember) {
      this.logger.warn(`[applyToTontine:ALREADY_MEMBER] userId=${userId} is already member of tontineId=${tontine.id}`);
      throw new BadRequestException('You are already a member of this tontine');
    }

    // Check if already applied
    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('tontine_applications')
      .select()
      .eq('tontine_id', tontine.id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      this.logger.warn(`[applyToTontine:ALREADY_APPLIED] userId=${userId} already applied to tontineId=${tontine.id}, status=${existing.status}`);
      throw new BadRequestException('You have already applied to this tontine');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_applications')
      .insert({
        tontine_id: tontine.id,
        invitation_id: invitation.id,
        user_id: userId,
        message: dto.message,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`[applyToTontine:INSERT_FAIL] ${error.message}`);
      throw new BadRequestException(`Failed to submit application: ${error.message}`);
    }

    this.logger.warn(`[applyToTontine:CREATED] appId=${data.id}, tontineId=${tontine.id}, userId=${userId}`);

    // Increment invitation use count
    await this.supabase
      .getAdminClient()
      .from('tontine_invitations')
      .update({ use_count: invitation.use_count + 1 })
      .eq('id', invitation.id);

    this.logger.warn(`[applyToTontine:USE_COUNT_UPDATED] invitationId=${invitation.id}`);

    await this.auditLogs.log({
      action: 'tontine.application_submitted',
      resourceType: 'tontine_application',
      resourceId: data.id,
      userId,
      metadata: { tontineId: tontine.id, invitationCode: code },
    });

    this.logger.warn(`[applyToTontine:COMPLETE] Success, appId=${data.id}`);

    return data;
  }

  /**
   * Get applications for a tontine
   */
  async getApplications(tontineId: string, userId: string): Promise<TontineApplication[]> {
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can view applications');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_applications')
      .select()
      .eq('tontine_id', tontineId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch applications: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Review application (approve/reject)
   */
  async reviewApplication(
    tontineId: string,
    applicationId: string,
    userId: string,
    dto: ReviewApplicationDto,
  ): Promise<TontineApplication> {
    this.logger.warn(`[reviewApplication:START] action=${dto.action}, appId=${applicationId}, tontineId=${tontineId}, reviewerId=${userId}`);
    
    const tontine = await this.getTontine(tontineId, userId);

    if (tontine.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can review applications');
    }

    const { data: application, error: appError } = await this.supabase
      .getAdminClient()
      .from('tontine_applications')
      .select()
      .eq('id', applicationId)
      .eq('tontine_id', tontineId)
      .single();

    if (appError || !application) {
      this.logger.error(`[reviewApplication:NOT_FOUND] appId=${applicationId}, tontineId=${tontineId}`);
      throw new NotFoundException('Application not found');
    }

    this.logger.warn(`[reviewApplication:FOUND] applicant=${application.user_id}, status=${application.status}`);

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application has already been reviewed');
    }

    const newStatus = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tontine_applications')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      this.logger.error(`[reviewApplication:UPDATE_FAIL] ${error.message}`);
      throw new BadRequestException(`Failed to review application: ${error.message}`);
    }

    this.logger.warn(`[reviewApplication:UPDATED] newStatus=${newStatus}`);

    // If approved, add as member
    if (dto.action === 'approve') {
      try {
        this.logger.warn(`[reviewApplication:ADDING_MEMBER] applicant=${application.user_id} to tontineId=${tontineId}`);
        await this.addMember(tontineId, userId, { user_id: application.user_id });
        this.logger.warn(`[reviewApplication:MEMBER_ADDED] Success`);
      } catch (memberError) {
        this.logger.error(`[reviewApplication:MEMBER_ADD_FAIL] ${memberError}`);
        throw memberError;
      }
    }

    await this.auditLogs.log({
      action: `tontine.application_${newStatus.toLowerCase()}`,
      resourceType: 'tontine_application',
      resourceId: applicationId,
      userId,
      metadata: { tontineId, applicantId: application.user_id },
    });

    this.logger.warn(`[reviewApplication:COMPLETE] action=${dto.action} done`);

    return data;
  }

  /**
   * Generate secure random invitation code
   */
  /**
   * Get user's pending applications across all tontines
   * Note: RLS policies may cause issues with nested relations, so we return empty on error
   */
  async getUserApplications(userId: string) {
    // Use adminClient to bypass RLS and avoid recursion issues
    const client = this.supabase.getAdminClient();

    try {
      this.logger.warn(`[getUserApplications:START] Fetching applications for userId=${userId}`);
      
      // Simple query without relations - avoid RLS policy recursion
      const { data: applications, error } = await client
        .from('tontine_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`[getUserApplications:ERROR] Supabase error: code=${error.code}, msg=${error.message}`);
        return [];
      }

      const appCount = applications?.length || 0;
      this.logger.warn(`[getUserApplications:FOUND] Total=${appCount} pending applications`);

      if (!applications || applications.length === 0) {
        this.logger.warn(`[getUserApplications:EMPTY] No applications found for userId=${userId}`);
        return [];
      }

      // Log each application
      applications.forEach((app, idx) => {
        this.logger.warn(`[getUserApplications:APP${idx}] id=${app.id}, tontine_id=${app.tontine_id}, status=${app.status}, created_at=${app.created_at}`);
      });

      // Try to enrich with tontine data, but don't fail if it doesn't work
      try {
        const tontineIds = [...new Set(applications.map(a => a.tontine_id))];
        this.logger.warn(`[getUserApplications:ENRICH] Fetching ${tontineIds.length} tontines: ${tontineIds.join(',')}`);
        
        const { data: tontines } = await client
          .from('tontines')
          .select('*')
          .in('id', tontineIds);

        this.logger.warn(`[getUserApplications:SUCCESS] Enriched with ${tontines?.length || 0} tontines`);

        return applications.map(app => ({
          ...app,
          tontines: tontines?.find(t => t.id === app.tontine_id) || null,
        }));
      } catch (enrichError) {
        this.logger.error(`[getUserApplications:ENRICH_FAIL] ${enrichError}`);
        return applications;
      }
    } catch (e) {
      this.logger.error(`[getUserApplications:EXCEPTION] ${e}`);
      return [];
    }
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 11) code += '-';
    }
    return code;
  }

  /**
   * Ensure user is eligible to participate in tontines
   * Requires APPROVED KYC status
   */
  private async ensureUserEligible(userId: string): Promise<void> {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('users')
      .select('id, kyc_status, email')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to verify user eligibility: ${error.message}`, undefined, { userId });
      throw new BadRequestException(`Unable to verify user: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('User not found');
    }

    if (data.kyc_status !== 'APPROVED') {
      throw new BadRequestException(
        'KYC verification must be approved before participating in tontines. Please complete your KYC verification in your profile.',
      );
    }

    this.logger.log(`User ${data.email} (${userId}) KYC verified for tontine participation`, TontinesService.name);
  }
}

