import { TontinesService } from './tontines.service';
import { CreateTontineDto, UpdateTontineDto, AddMemberDto, RecordContributionDto, CreateInvitationDto, ApplyToTontineDto, ReviewApplicationDto } from './tontines.types';
export declare class TontinesController {
    private readonly tontinesService;
    constructor(tontinesService: TontinesService);
    create(req: Record<string, unknown>, dto: CreateTontineDto): Promise<import("./tontines.types").Tontine>;
    getAllTontinesAdmin(): Promise<import("./tontines.types").Tontine[]>;
    getUserTontines(req: Record<string, unknown>): Promise<import("./tontines.types").Tontine[]>;
    getUserApplications(req: Record<string, unknown>): Promise<any[]>;
    getTontine(req: Record<string, unknown>, tontineId: string): Promise<import("./tontines.types").Tontine>;
    updateTontine(req: Record<string, unknown>, tontineId: string, dto: UpdateTontineDto): Promise<import("./tontines.types").Tontine>;
    startTontine(req: Record<string, unknown>, tontineId: string): Promise<import("./tontines.types").TontineCycle>;
    addMember(req: Record<string, unknown>, tontineId: string, dto: AddMemberDto): Promise<import("./tontines.types").TontineMember>;
    getMembers(req: Record<string, unknown>, tontineId: string): Promise<import("./tontines.types").TontineMember[]>;
    recordContribution(req: Record<string, unknown>, tontineId: string, dto: RecordContributionDto): Promise<import("./tontines.types").TontineContribution>;
    getStatistics(req: Record<string, unknown>, tontineId: string): Promise<Record<string, unknown>>;
    getMemberStatistics(req: Record<string, unknown>, tontineId: string, memberId: string): Promise<import("./tontines.types").MemberStatistics>;
    createInvitation(req: Record<string, unknown>, tontineId: string, dto: CreateInvitationDto): Promise<import("./tontines.types").TontineInvitation>;
    getTontineByInviteCode(code: string): Promise<{
        tontine: import("./tontines.types").Tontine;
        invitation: import("./tontines.types").TontineInvitation;
    }>;
    applyToTontine(req: Record<string, unknown>, code: string, dto: ApplyToTontineDto): Promise<import("./tontines.types").TontineApplication>;
    getApplications(req: Record<string, unknown>, tontineId: string): Promise<import("./tontines.types").TontineApplication[]>;
    reviewApplication(req: Record<string, unknown>, tontineId: string, applicationId: string, dto: ReviewApplicationDto): Promise<import("./tontines.types").TontineApplication>;
}
