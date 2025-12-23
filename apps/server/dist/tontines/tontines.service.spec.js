"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const tontines_service_1 = require("./tontines.service");
const tontines_types_1 = require("./tontines.types");
describe('TontinesService (unit)', () => {
    const auditLogs = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    const buildAdminClient = (config) => ({
        from: (table) => {
            if (table === 'tontines') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: config.tontineData ?? null,
                                error: config.tontineError ?? null,
                            }),
                        }),
                    }),
                    or: () => ({
                        order: jest.fn().mockResolvedValue({
                            data: config.listData ?? null,
                            error: config.listError ?? null,
                        }),
                    }),
                    insert: () => ({
                        select: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: config.insertResult ?? { id: 't-created' },
                                error: config.insertError ?? null,
                            }),
                        }),
                    }),
                    update: () => ({
                        eq: () => ({
                            select: () => ({
                                single: jest.fn().mockResolvedValue({
                                    data: config.updateResult ?? { id: 't-updated' },
                                    error: config.updateError ?? null,
                                }),
                            }),
                        }),
                    }),
                };
            }
            if (table === 'tontine_members') {
                return {
                    select: () => ({
                        eq: () => ({
                            order: jest.fn().mockResolvedValue({
                                data: config.membersList ?? [],
                                error: config.membersListError ?? null,
                            }),
                            eq: () => ({
                                single: jest.fn().mockResolvedValue({
                                    data: config.memberData ?? null,
                                    error: config.memberError ?? null,
                                }),
                            }),
                        }),
                    }),
                    insert: (rows) => ({
                        select: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: config.insertResult ?? rows?.[0] ?? { id: 'm-created' },
                                error: config.insertError ?? null,
                            }),
                        }),
                    }),
                    update: () => ({ eq: () => ({}) }),
                };
            }
            if (table === 'tontine_contributions') {
                return {
                    select: () => ({
                        eq: (field) => {
                            if (field === 'tontine_id') {
                                return Promise.resolve({ data: config.contributionsList ?? [], error: null });
                            }
                            if (field === 'member_id') {
                                return Promise.resolve({ data: config.memberContributionsList ?? [], error: null });
                            }
                            return {
                                eq: () => ({
                                    single: jest.fn().mockResolvedValue({
                                        data: config.contributionSingle ?? null,
                                        error: config.contributionError ?? null,
                                    }),
                                }),
                            };
                        },
                    }),
                    update: () => ({
                        eq: () => ({
                            select: () => ({
                                single: jest.fn().mockResolvedValue({
                                    data: config.updateResult ?? { id: 'c-updated' },
                                    error: config.updateError ?? null,
                                }),
                            }),
                        }),
                    }),
                    insert: () => ({ error: null }),
                };
            }
            if (table === 'tontine_cycles') {
                return {
                    insert: () => ({
                        select: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: config.insertResult ?? { id: 'cycle-1' },
                                error: config.insertError ?? null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'tontine_invitations') {
                return {
                    insert: (rows) => ({
                        select: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: config.insertResult ?? rows?.[0] ?? { id: 'inv-created', code: 'TEST-CODE-1234' },
                                error: config.insertError ?? null,
                            }),
                        }),
                    }),
                    update: () => ({
                        eq: () => ({
                            select: () => ({
                                single: jest.fn().mockResolvedValue({
                                    data: config.updateResult ?? { id: 'inv-updated' },
                                    error: config.updateError ?? null,
                                }),
                            }),
                        }),
                    }),
                };
            }
            if (table === 'users') {
                return {
                    select: () => ({
                        eq: () => ({
                            maybeSingle: jest.fn().mockResolvedValue({
                                data: config.userData ?? null,
                                error: config.userData ? null : { message: 'User not found' },
                            }),
                        }),
                    }),
                };
            }
            return { select: () => ({}) };
        },
    });
    const buildSupabase = (adminClient) => ({
        getAdminClient: jest.fn(() => adminClient),
        getClient: jest.fn(() => adminClient),
    });
    const baseDto = {
        name: 'My tontine',
        contribution_amount: 50,
        currency: 'EUR',
        frequency: 'MONTHLY',
        total_cycles: 3,
        cycle_duration_days: 30,
    };
    it('throws when total_cycles < 1', async () => {
        const supabase = buildSupabase(buildAdminClient({ userData: { id: 'user-1', kyc_status: 'APPROVED', email: 'test@test.com' } }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.createTontine('user-1', { ...baseDto, total_cycles: 0 })).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('throws when contribution_amount <= 0', async () => {
        const supabase = buildSupabase(buildAdminClient({ userData: { id: 'user-1', kyc_status: 'APPROVED', email: 'test@test.com' } }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.createTontine('user-1', { ...baseDto, contribution_amount: 0 })).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('returns empty list on supabase error', async () => {
        const supabase = buildSupabase(buildAdminClient({ listData: null, listError: { message: 'boom' } }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const result = await service.getUserTontines('user-1');
        expect(result).toEqual([]);
    });
    it('throws NotFound when tontine missing', async () => {
        const supabase = buildSupabase(buildAdminClient({ tontineData: null, tontineError: { message: 'not found' } }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.getTontine('t-1', 'user-1')).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('returns tontine when creator matches and member check passes', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: { id: 't-1', creator_id: 'user-1', status: 'ACTIVE' },
            memberData: null,
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const tontine = await service.getTontine('t-1', 'user-1');
        expect(tontine).toMatchObject({ id: 't-1', creator_id: 'user-1' });
    });
    it('creates tontine successfully with valid payload', async () => {
        const supabase = buildSupabase(buildAdminClient({
            insertResult: { id: 't-created' },
            userData: { id: 'user-1', kyc_status: 'APPROVED', email: 'test@test.com' }
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const created = await service.createTontine('user-1', baseDto);
        expect(created.id).toBe('t-created');
        expect(auditLogs.log).toHaveBeenCalled();
    });
    it('addMember rejects if already member', async () => {
        const supabase = buildSupabase(buildAdminClient({
            userData: { id: 'user-1', kyc_status: 'APPROVED', email: 'test@test.com' },
            tontineData: { id: 't-1', creator_id: 'user-1', contribution_amount: 10, total_cycles: 2 },
            memberData: { id: 'm-1' },
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.addMember('t-1', 'user-1', { user_id: 'user-2' })).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('startTontine rejects when less than 2 members', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: {
                id: 't-1',
                creator_id: 'user-1',
                contribution_amount: 10,
                total_cycles: 2,
                cycle_duration_days: 10,
                status: 'PENDING',
            },
            membersList: [{ id: 'm-1' }],
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.startTontine('t-1', 'user-1')).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('recordContribution rejects when contribution not found', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: { id: 't-1', creator_id: 'user-1' },
            memberData: null,
            memberError: { message: 'not found' },
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        await expect(service.recordContribution('t-1', 'user-1', { member_id: 'm-1', cycle_id: 'c-1', amount: 10 })).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('startTontine succeeds with 2 members', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: {
                id: 't-1',
                creator_id: 'user-1',
                contribution_amount: 10,
                total_cycles: 2,
                cycle_duration_days: 10,
                status: 'PENDING',
                currency: 'EUR',
            },
            membersList: [{ id: 'm-1' }, { id: 'm-2' }],
            insertResult: { id: 'cycle-1' },
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const cycle = await service.startTontine('t-1', 'user-1');
        expect(cycle.id).toBe('cycle-1');
    });
    it('recordContribution succeeds and logs', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: { id: 't-1', creator_id: 'user-1' },
            contributionSingle: { id: 'c-1', total_contributed: 5 },
            updateResult: { id: 'c-1' },
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const result = await service.recordContribution('t-1', 'user-1', {
            member_id: 'm-1',
            cycle_id: 'c-1',
            amount: 10,
            payment_method: tontines_types_1.PaymentMethod.CASH,
        });
        expect(result.id).toBe('c-1');
        expect(auditLogs.log).toHaveBeenCalled();
    });
    it('getTontineStatistics returns aggregates', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: {
                id: 't-1',
                creator_id: 'user-1',
                name: 'My',
                status: 'ACTIVE',
                current_cycle: 1,
                total_cycles: 3,
                contribution_amount: 10,
            },
            membersList: [
                { id: 'm-1', status: 'ACTIVE' },
                { id: 'm-2', status: 'ACTIVE' },
            ],
            contributionsList: [
                { amount: 10, status: 'PAID' },
                { amount: 10, status: 'PENDING' },
            ],
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const stats = (await service.getTontineStatistics('t-1', 'user-1'));
        expect(stats.members.total).toBe(2);
        expect(stats.contributions.collected).toBe(20);
        expect(stats.contributions.rate).toBeCloseTo(50);
    });
    it('getMemberStatistics returns contribution breakdown', async () => {
        const supabase = buildSupabase(buildAdminClient({
            tontineData: { id: 't-1', creator_id: 'user-1' },
            memberData: {
                id: 'm-1',
                tontine_id: 't-1',
                total_contributed: 15,
                total_expected: 30,
                has_received_distribution: false,
            },
            memberContributionsList: [
                { status: 'PAID' },
                { status: 'PENDING' },
                { status: 'LATE' },
            ],
        }));
        const service = new tontines_service_1.TontinesService(supabase, auditLogs);
        const stats = (await service.getMemberStatistics('t-1', 'm-1', 'user-1'));
        expect(stats.total_contributed).toBe(15);
        expect(stats.contribution_rate).toBeCloseTo(50);
        expect(stats.pending_contributions).toBe(1);
        expect(stats.late_contributions).toBe(1);
    });
    describe('Invitation System', () => {
        it('createInvitation validates tontine status is PENDING', async () => {
            const supabase = buildSupabase(buildAdminClient({
                tontineData: {
                    id: 't-1',
                    creator_id: 'user-1',
                    status: 'ACTIVE',
                    name: 'Active Tontine',
                },
            }));
            const service = new tontines_service_1.TontinesService(supabase, auditLogs);
            await expect(service.createInvitation('t-1', 'user-1', {})).rejects.toThrow(common_1.BadRequestException);
        });
        it('createInvitation validates user is creator', async () => {
            const supabase = buildSupabase(buildAdminClient({
                tontineData: {
                    id: 't-1',
                    creator_id: 'other-user',
                    status: 'PENDING',
                    name: 'Pending Tontine',
                },
            }));
            const service = new tontines_service_1.TontinesService(supabase, auditLogs);
            await expect(service.createInvitation('t-1', 'user-1', {})).rejects.toThrow(common_1.ForbiddenException);
        });
        it('createInvitation generates unique code and creates invitation', async () => {
            const invitationData = {
                id: 'inv-1',
                code: 'ABCD-EFGH-IJKL',
                tontine_id: 't-1',
                created_by: 'user-1',
            };
            const supabase = buildSupabase(buildAdminClient({
                tontineData: {
                    id: 't-1',
                    creator_id: 'user-1',
                    status: 'PENDING',
                    name: 'Pending Tontine',
                },
                insertResult: invitationData,
            }));
            const service = new tontines_service_1.TontinesService(supabase, auditLogs);
            const result = await service.createInvitation('t-1', 'user-1', {
                expires_in_days: 7,
                max_uses: 10,
            });
            expect(result.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
            expect(auditLogs.log).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=tontines.service.spec.js.map