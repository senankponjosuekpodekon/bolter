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
var TontinesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TontinesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const tontines_types_1 = require("./tontines.types");
let TontinesService = TontinesService_1 = class TontinesService {
    constructor(supabase, auditLogs) {
        this.supabase = supabase;
        this.auditLogs = auditLogs;
        this.logger = new common_1.Logger(TontinesService_1.name);
    }
    async createTontine(userId, dto) {
        if (dto.total_cycles < 1) {
            throw new common_1.BadRequestException('Total cycles must be at least 1');
        }
        if (dto.contribution_amount <= 0) {
            throw new common_1.BadRequestException('Contribution amount must be positive');
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
            distribution_method: dto.distribution_method || tontines_types_1.DistributionMethod.SENIORITY,
            status: tontines_types_1.TontineStatus.PENDING,
            late_payment_penalty_percent: dto.late_payment_penalty_percent || 0,
            withdrawal_allowed: dto.withdrawal_allowed || false,
            withdrawal_penalty_percent: dto.withdrawal_penalty_percent || 10,
            metadata: dto.metadata || {},
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create tontine: ${error.message}`);
        await this.auditLogs.log({
            action: 'tontine.created',
            resourceType: 'tontine',
            resourceId: data.id,
            userId,
            metadata: { name: data.name },
        });
        if (dto.initial_members && Array.isArray(dto.initial_members) && dto.initial_members.length > 0) {
            const seen = new Set();
            const sanitized = dto.initial_members.filter((m) => {
                if (!m?.user_id)
                    return false;
                if (seen.has(m.user_id))
                    return false;
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
                }
            }
        }
        return data;
    }
    async getTontine(tontineId, userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tontines')
            .select()
            .eq('id', tontineId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Tontine not found');
        }
        const isMember = await this.isMember(tontineId, userId);
        if (data.creator_id !== userId && !isMember) {
            throw new common_1.ForbiddenException('You do not have access to this tontine');
        }
        return data;
    }
    async getUserTontines(userId) {
        const client = this.supabase.getAdminClient();
        const { data: createdByUser, error: creatorError } = await client
            .from('tontines')
            .select()
            .eq('creator_id', userId);
        if (creatorError) {
            this.logger.error(`Failed to fetch creator tontines: ${creatorError.message}`);
            throw new common_1.BadRequestException(`Failed to fetch tontines: ${creatorError.message}`);
        }
        const { data: memberLinks, error: memberError } = await client
            .from('tontine_members')
            .select('tontine_id')
            .eq('user_id', userId);
        if (memberError) {
            this.logger.error(`Failed to fetch tontine memberships: ${memberError.message}`);
            throw new common_1.BadRequestException(`Failed to fetch tontines: ${memberError.message}`);
        }
        const memberIds = (memberLinks || [])
            .map((m) => m.tontine_id)
            .filter((id) => Boolean(id));
        let memberTontines = [];
        if (memberIds.length > 0) {
            const { data: fetchedMembers, error: memberTontinesError } = await client
                .from('tontines')
                .select()
                .in('id', memberIds);
            if (memberTontinesError) {
                this.logger.error(`Failed to fetch member tontines: ${memberTontinesError.message}`);
                throw new common_1.BadRequestException(`Failed to fetch tontines: ${memberTontinesError.message}`);
            }
            memberTontines = fetchedMembers || [];
        }
        const combined = [...(createdByUser || []), ...memberTontines];
        const deduped = Array.from(new Map(combined.map((t) => [t.id, t])).values());
        return deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    async updateTontine(tontineId, userId, dto) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can update the tontine');
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
        if (error)
            throw new common_1.BadRequestException(`Failed to update tontine: ${error.message}`);
        await this.auditLogs.log({
            action: 'tontine.updated',
            resourceType: 'tontine',
            resourceId: tontineId,
            userId,
            metadata: { changes: dto },
        });
        return data;
    }
    async addMember(tontineId, userId, dto) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can add members');
        }
        if (tontine.status !== tontines_types_1.TontineStatus.PENDING) {
            throw new common_1.BadRequestException('Members can only be added while the tontine is pending');
        }
        const { data: existingMember } = await this.supabase
            .getAdminClient()
            .from('tontine_members')
            .select()
            .eq('tontine_id', tontineId)
            .eq('user_id', dto.user_id)
            .single();
        if (existingMember) {
            throw new common_1.BadRequestException('User is already a member of this tontine');
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
        if (error)
            throw new common_1.BadRequestException(`Failed to add member: ${error.message}`);
        await this.auditLogs.log({
            action: 'tontine.member_added',
            resourceType: 'tontine_member',
            resourceId: data.id,
            userId,
            metadata: { tontineId, newMemberId: dto.user_id },
        });
        return data;
    }
    async getMembers(tontineId, userId) {
        await this.getTontine(tontineId, userId);
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
    async startTontine(tontineId, userId) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can start the tontine');
        }
        if (tontine.status === tontines_types_1.TontineStatus.ACTIVE) {
            throw new common_1.BadRequestException('Tontine is already active');
        }
        const members = await this.getMembers(tontineId, userId);
        if (members.length < 2) {
            throw new common_1.BadRequestException('At least 2 members are required to start a tontine');
        }
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
        if (cycleError)
            throw new common_1.BadRequestException(`Failed to create cycle: ${cycleError.message}`);
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
        await this.supabase
            .getAdminClient()
            .from('tontines')
            .update({
            status: tontines_types_1.TontineStatus.ACTIVE,
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
    async recordContribution(tontineId, userId, dto) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can record contributions');
        }
        const { data: contribution, error: getError } = await this.supabase
            .getAdminClient()
            .from('tontine_contributions')
            .select()
            .eq('id', dto.member_id)
            .eq('cycle_id', dto.cycle_id)
            .single();
        if (getError || !contribution) {
            throw new common_1.NotFoundException('Contribution record not found');
        }
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
        if (error)
            throw new common_1.BadRequestException(`Failed to record contribution: ${error.message}`);
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
    async getTontineStatistics(tontineId, userId) {
        const tontine = await this.getTontine(tontineId, userId);
        const members = await this.getMembers(tontineId, userId);
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
    async getMemberStatistics(tontineId, memberId, userId) {
        await this.getTontine(tontineId, userId);
        const { data: member, error } = await this.supabase
            .getAdminClient()
            .from('tontine_members')
            .select()
            .eq('id', memberId)
            .eq('tontine_id', tontineId)
            .single();
        if (error || !member) {
            throw new common_1.NotFoundException('Member not found');
        }
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
    async isMember(tontineId, userId) {
        const { data } = await this.supabase
            .getAdminClient()
            .from('tontine_members')
            .select()
            .eq('tontine_id', tontineId)
            .eq('user_id', userId)
            .single();
        return !!data;
    }
    async createInvitation(tontineId, userId, dto) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can create invitations');
        }
        if (tontine.status !== tontines_types_1.TontineStatus.PENDING) {
            throw new common_1.BadRequestException('Invitations can only be created for pending tontines');
        }
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
        if (error)
            throw new common_1.BadRequestException(`Failed to create invitation: ${error.message}`);
        await this.auditLogs.log({
            action: 'tontine.invitation_created',
            resourceType: 'tontine_invitation',
            resourceId: data.id,
            userId,
            metadata: { tontineId, code },
        });
        return data;
    }
    async getTontineByInviteCode(code) {
        const { data: invitation, error: inviteError } = await this.supabase
            .getAdminClient()
            .from('tontine_invitations')
            .select()
            .eq('code', code)
            .single();
        if (inviteError || !invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.revoked_at) {
            throw new common_1.BadRequestException('This invitation has been revoked');
        }
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            throw new common_1.BadRequestException('This invitation has expired');
        }
        if (invitation.max_uses && invitation.use_count >= invitation.max_uses) {
            throw new common_1.BadRequestException('This invitation has reached its maximum uses');
        }
        const { data: tontine, error: tontineError } = await this.supabase
            .getAdminClient()
            .from('tontines')
            .select()
            .eq('id', invitation.tontine_id)
            .single();
        if (tontineError || !tontine) {
            throw new common_1.NotFoundException('Tontine not found');
        }
        return { tontine, invitation };
    }
    async applyToTontine(code, userId, dto) {
        const { tontine, invitation } = await this.getTontineByInviteCode(code);
        if (tontine.status !== tontines_types_1.TontineStatus.PENDING) {
            throw new common_1.BadRequestException('This tontine is not accepting applications');
        }
        const isMember = await this.isMember(tontine.id, userId);
        if (isMember) {
            throw new common_1.BadRequestException('You are already a member of this tontine');
        }
        const { data: existing } = await this.supabase
            .getAdminClient()
            .from('tontine_applications')
            .select()
            .eq('tontine_id', tontine.id)
            .eq('user_id', userId)
            .single();
        if (existing) {
            throw new common_1.BadRequestException('You have already applied to this tontine');
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
        if (error)
            throw new common_1.BadRequestException(`Failed to submit application: ${error.message}`);
        await this.supabase
            .getAdminClient()
            .from('tontine_invitations')
            .update({ use_count: invitation.use_count + 1 })
            .eq('id', invitation.id);
        await this.auditLogs.log({
            action: 'tontine.application_submitted',
            resourceType: 'tontine_application',
            resourceId: data.id,
            userId,
            metadata: { tontineId: tontine.id, invitationCode: code },
        });
        return data;
    }
    async getApplications(tontineId, userId) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can view applications');
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
    async reviewApplication(tontineId, applicationId, userId, dto) {
        const tontine = await this.getTontine(tontineId, userId);
        if (tontine.creator_id !== userId) {
            throw new common_1.ForbiddenException('Only the creator can review applications');
        }
        const { data: application, error: appError } = await this.supabase
            .getAdminClient()
            .from('tontine_applications')
            .select()
            .eq('id', applicationId)
            .eq('tontine_id', tontineId)
            .single();
        if (appError || !application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.status !== 'PENDING') {
            throw new common_1.BadRequestException('Application has already been reviewed');
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
        if (error)
            throw new common_1.BadRequestException(`Failed to review application: ${error.message}`);
        if (dto.action === 'approve') {
            await this.addMember(tontineId, userId, { user_id: application.user_id });
        }
        await this.auditLogs.log({
            action: `tontine.application_${newStatus.toLowerCase()}`,
            resourceType: 'tontine_application',
            resourceId: applicationId,
            userId,
            metadata: { tontineId, applicantId: application.user_id },
        });
        return data;
    }
    generateInviteCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 12; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
            if ((i + 1) % 4 === 0 && i < 11)
                code += '-';
        }
        return code;
    }
};
exports.TontinesService = TontinesService;
exports.TontinesService = TontinesService = TontinesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService])
], TontinesService);
//# sourceMappingURL=tontines.service.js.map