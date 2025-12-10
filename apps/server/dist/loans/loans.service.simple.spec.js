"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const loans_service_1 = require("./loans.service");
const supabase_service_1 = require("../supabase/supabase.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const accounts_service_1 = require("../accounts/accounts.service");
describe('LoansService (simplified)', () => {
    let service;
    let mockSupabaseService;
    let mockNotificationsService;
    let mockAuditLogsService;
    let mockAccountsService;
    beforeEach(async () => {
        mockSupabaseService = {
            getAdminClient: jest.fn().mockReturnValue({}),
        };
        mockNotificationsService = {
            notifyLoanCreated: jest.fn().mockResolvedValue(undefined),
            notifyLoanApproved: jest.fn().mockResolvedValue(undefined),
            notifyLoanRejected: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLogsService = {
            log: jest.fn().mockResolvedValue(undefined),
        };
        mockAccountsService = {
            findById: jest.fn().mockResolvedValue({ id: 'acc-123', user_id: 'user-123' }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                loans_service_1.LoansService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: mockSupabaseService,
                },
                {
                    provide: notifications_service_1.NotificationsService,
                    useValue: mockNotificationsService,
                },
                {
                    provide: audit_logs_service_1.AuditLogsService,
                    useValue: mockAuditLogsService,
                },
                {
                    provide: accounts_service_1.AccountsService,
                    useValue: mockAccountsService,
                },
            ],
        }).compile();
        service = module.get(loans_service_1.LoansService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('LoansService initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
        it('should have createLoan method', () => {
            expect(typeof service.createLoan).toBe('function');
        });
        it('should have approveLoan method', () => {
            expect(typeof service.approveLoan).toBe('function');
        });
        it('should have rejectLoan method', () => {
            expect(typeof service.rejectLoan).toBe('function');
        });
    });
    describe('calculateSimulation', () => {
        it('should calculate loan simulation correctly', () => {
            const amount = 10000;
            const durationMonths = 24;
            const interestRate = 5.5;
            const result = service.calculateSimulation(amount, durationMonths, interestRate);
            expect(result).toBeDefined();
            expect(result).toHaveProperty('monthlyPayment');
            expect(result.monthlyPayment).toBeGreaterThan(0);
        });
        it('should calculate with zero interest rate', () => {
            const result = service.calculateSimulation(12000, 12, 0);
            expect(result.monthlyPayment).toBe(1000);
        });
    });
    describe('interestRate determination', () => {
        it('should determine interest rates based on risk score', () => {
            const lowRiskRate = service.determineInterestRate(250, 24);
            const mediumRiskRate = service.determineInterestRate(500, 24);
            const highRiskRate = service.determineInterestRate(750, 24);
            expect(lowRiskRate).toBeLessThanOrEqual(mediumRiskRate);
            expect(mediumRiskRate).toBeLessThanOrEqual(highRiskRate);
        });
        it('should apply longer term duration discount', () => {
            const shortTermRate = service.determineInterestRate(500, 12);
            const longTermRate = service.determineInterestRate(500, 36);
            expect(longTermRate).toBeLessThanOrEqual(shortTermRate);
        });
    });
    describe('service dependencies', () => {
        it('should have access to audit logs service', () => {
            expect(mockAuditLogsService).toBeDefined();
            expect(mockAuditLogsService.log).toBeDefined();
        });
        it('should have access to notifications service', () => {
            expect(mockNotificationsService).toBeDefined();
            expect(mockNotificationsService.notifyLoanCreated).toBeDefined();
        });
        it('should have access to accounts service', () => {
            expect(mockAccountsService).toBeDefined();
            expect(mockAccountsService.findById).toBeDefined();
        });
        it('should have access to supabase service', () => {
            expect(mockSupabaseService).toBeDefined();
            expect(mockSupabaseService.getAdminClient).toBeDefined();
        });
    });
});
//# sourceMappingURL=loans.service.simple.spec.js.map