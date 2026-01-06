import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Tontine, TontineMember, TontineCycle, TontineContribution, CreateTontineDto, UpdateTontineDto, AddMemberDto, RecordContributionDto, MemberStatistics, TontineInvitation, TontineApplication, CreateInvitationDto, ApplyToTontineDto, ReviewApplicationDto } from './tontines.types';
import { PayTontineDto } from './dto/pay-tontine.dto';
export declare class TontinesService {
    private supabase;
    private auditLogs;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogs: AuditLogsService);
    createTontine(userId: string, dto: CreateTontineDto): Promise<Tontine>;
    getTontine(tontineId: string, userId: string): Promise<Tontine>;
    getUserTontines(userId: string): Promise<Tontine[]>;
    updateTontine(tontineId: string, userId: string, dto: UpdateTontineDto): Promise<Tontine>;
    addMember(tontineId: string, userId: string, dto: AddMemberDto): Promise<TontineMember>;
    getMembers(tontineId: string, userId: string): Promise<TontineMember[]>;
    startTontine(tontineId: string, userId: string): Promise<TontineCycle>;
    payTontine(tontineId: string, userId: string, dto: PayTontineDto): Promise<TontineContribution>;
    recordContribution(tontineId: string, userId: string, dto: RecordContributionDto): Promise<TontineContribution>;
    getTontineStatistics(tontineId: string, userId: string): Promise<Record<string, unknown>>;
    getMemberStatistics(tontineId: string, memberId: string, userId: string): Promise<MemberStatistics>;
    private isMember;
    createInvitation(tontineId: string, userId: string, dto: CreateInvitationDto): Promise<TontineInvitation>;
    getTontineByInviteCode(code: string): Promise<{
        tontine: Tontine;
        invitation: TontineInvitation;
    }>;
    applyToTontine(code: string, userId: string, dto: ApplyToTontineDto): Promise<TontineApplication>;
    getApplications(tontineId: string, userId: string): Promise<TontineApplication[]>;
    reviewApplication(tontineId: string, applicationId: string, userId: string, dto: ReviewApplicationDto): Promise<TontineApplication>;
    getUserApplications(userId: string): Promise<any[]>;
    private generateInviteCode;
    private ensureUserEligible;
}
