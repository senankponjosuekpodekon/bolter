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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const analytics_exception_1 = require("./exceptions/analytics.exception");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.cacheMap = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async generateReport(query) {
        try {
            this.validateReportQuery(query);
            const cacheKey = this.generateCacheKey(query);
            const cached = this.getCache(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for report: ${query.type}`);
                return cached;
            }
            this.logger.log(`Generating report: type=${query.type}, dateRange=${query.startDate.toISOString()} to ${query.endDate.toISOString()}`);
            let data = [];
            let rawCount = 0;
            try {
                switch (query.type) {
                    case 'transactions':
                        ({ data, rawCount } = await this.getTransactionAnalytics(query));
                        break;
                    case 'users':
                        ({ data, rawCount } = await this.getUserAnalytics(query));
                        break;
                    case 'kyc':
                        ({ data, rawCount } = await this.getKycAnalytics(query));
                        break;
                    case 'loans':
                        ({ data, rawCount } = await this.getLoanAnalytics(query));
                        break;
                    case 'accounts':
                        ({ data, rawCount } = await this.getAccountAnalytics(query));
                        break;
                    case 'tontines':
                        ({ data, rawCount } = await this.getTontineAnalytics(query));
                        break;
                    default:
                        throw analytics_exception_1.AnalyticsException.invalidReportType(query.type, ['transactions', 'users', 'kyc', 'loans', 'accounts', 'tontines']);
                }
            }
            catch (error) {
                this.logger.error(`Failed to fetch analytics for ${query.type}:`, error instanceof Error ? error.message : error);
                if (error instanceof analytics_exception_1.AnalyticsException)
                    throw error;
                throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', query.type);
            }
            if (data.length === 0) {
                this.logger.warn(`No data found for report type ${query.type} in date range`);
            }
            const result = {
                id: this.generateReportId(),
                name: `${query.type} Report - ${new Date().toISOString()}`,
                type: query.type,
                generatedAt: new Date(),
                data,
                summary: {
                    totalRecords: rawCount,
                    startDate: query.startDate,
                    endDate: query.endDate,
                    segments: new Set(data.map((d) => d.segment)).size,
                },
            };
            this.setCache(cacheKey, result);
            this.logger.debug(`Report generated successfully: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Report generation failed:`, error instanceof Error ? error.stack : error);
            throw error;
        }
    }
    validateReportQuery(query) {
        if (!query.type || !query.startDate || !query.endDate || !query.tenantId) {
            throw analytics_exception_1.AnalyticsException.validationError('Missing required report parameters', {
                required: ['type', 'startDate', 'endDate', 'tenantId'],
                provided: Object.keys(query),
            });
        }
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw analytics_exception_1.AnalyticsException.validationError('Invalid date format', {
                startDate: query.startDate,
                endDate: query.endDate,
            });
        }
        if (startDate >= endDate) {
            throw analytics_exception_1.AnalyticsException.invalidDateRange(startDate, endDate);
        }
        const maxRange = 2 * 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > maxRange) {
            throw analytics_exception_1.AnalyticsException.validationError('Date range is too large (max 2 years)', {
                maxRange: '2 years',
                requestedRange: Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
            });
        }
        const validAggregations = ['sum', 'avg', 'count', 'min', 'max'];
        if (query.aggregation && !validAggregations.includes(query.aggregation)) {
            throw analytics_exception_1.AnalyticsException.validationError('Invalid aggregation type', {
                provided: query.aggregation,
                valid: validAggregations,
            });
        }
    }
    async getTransactionAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('id, amount, status, created_at')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'transactions');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No transaction data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['status'], query.aggregation || 'sum');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'transactions');
        }
    }
    async getUserAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('users')
                .select('id, created_at, status')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'users');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No user data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['status'], 'count');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'users');
        }
    }
    async getKycAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('kyc_documents')
                .select('id, status, created_at, document_type')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'kyc_documents');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No KYC data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['status'], 'count');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'kyc_documents');
        }
    }
    async getLoanAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('loans')
                .select('id, amount, status, created_at')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'loans');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No loan data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['status'], query.aggregation || 'sum');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'loans');
        }
    }
    async getAccountAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('accounts')
                .select('id, balance, currency, created_at')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'accounts');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No account data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['account_type'], query.aggregation || 'sum');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'accounts');
        }
    }
    async getTontineAnalytics(query) {
        try {
            const supabaseClient = this.supabaseService.getAdminClient();
            const { data, error } = await supabaseClient
                .from('tontines')
                .select('id, name, status, contribution_amount, total_cycles, current_cycle, created_at')
                .gte('created_at', query.startDate.toISOString())
                .lte('created_at', query.endDate.toISOString());
            if (error) {
                throw analytics_exception_1.AnalyticsException.databaseError(error.message, 'tontines');
            }
            if (!data || data.length === 0) {
                this.logger.debug('No tontine data found for the date range');
                return { data: [], rawCount: 0 };
            }
            const aggregated = this.aggregateData(data, query.groupBy || ['status'], query.aggregation || 'count');
            return { data: aggregated, rawCount: data.length };
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException)
                throw error;
            throw analytics_exception_1.AnalyticsException.databaseError(error instanceof Error ? error.message : 'Unknown error', 'tontines');
        }
    }
    aggregateData(data, groupByFields, aggregation) {
        if (!data || data.length === 0) {
            this.logger.debug('No data to aggregate');
            return [];
        }
        try {
            const aggregated = {};
            data.forEach((record) => {
                const key = groupByFields
                    .map((field) => {
                    const value = record[field];
                    return value !== null && value !== undefined ? String(value) : 'unknown';
                })
                    .join('_');
                if (!aggregated[key]) {
                    aggregated[key] = {
                        segment: key,
                        records: [],
                        timestamp: new Date(record.created_at || record.updated_at || new Date()),
                    };
                }
                aggregated[key].records = [...aggregated[key].records, record];
            });
            const result = Object.values(aggregated).map((group) => ({
                timestamp: new Date(group.timestamp),
                segment: group.segment,
                value: this.performAggregation(group.records, aggregation),
            }));
            this.logger.debug(`Aggregated ${data.length} records into ${result.length} segments`);
            return result;
        }
        catch (error) {
            this.logger.error('Aggregation failed:', error instanceof Error ? error.message : error);
            throw analytics_exception_1.AnalyticsException.internalError(error);
        }
    }
    performAggregation(records, aggregation) {
        if (!records || records.length === 0) {
            return 0;
        }
        try {
            const values = records
                .map((r) => r.amount || r.balance || 1)
                .filter((v) => typeof v === 'number' && !isNaN(v));
            if (values.length === 0) {
                return 0;
            }
            switch (aggregation) {
                case 'sum':
                    return values.reduce((a, b) => a + b, 0);
                case 'avg':
                    return values.reduce((a, b) => a + b, 0) / values.length;
                case 'count':
                    return records.length;
                case 'min':
                    return Math.min(...values);
                case 'max':
                    return Math.max(...values);
                default:
                    return records.length;
            }
        }
        catch (error) {
            this.logger.error(`Aggregation error for type ${aggregation}:`, error instanceof Error ? error.message : error);
            return 0;
        }
    }
    exportToCSV(report) {
        const headers = ['timestamp', 'segment', 'value'];
        const rows = report.data.map((item) => [
            item.timestamp.toISOString(),
            item.segment,
            item.value.toString(),
        ]);
        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        return csv;
    }
    exportToJSON(report) {
        return JSON.stringify(report, null, 2);
    }
    async getTimeSeriesData(query, interval = 'daily') {
        const baseReport = await this.generateReport(query);
        return this.groupByTimeInterval(baseReport.data, interval);
    }
    groupByTimeInterval(data, interval) {
        const grouped = {};
        data.forEach((item) => {
            const key = this.getTimeKey(item.timestamp, interval);
            if (!grouped[key]) {
                grouped[key] = {
                    timestamp: this.getTimeStart(item.timestamp, interval),
                    segment: item.segment,
                    value: 0,
                };
            }
            grouped[key].value += item.value;
        });
        return Object.values(grouped).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    getTimeKey(date, interval) {
        const d = new Date(date);
        switch (interval) {
            case 'hourly':
                return d.toISOString().slice(0, 13);
            case 'daily':
                return d.toISOString().slice(0, 10);
            case 'weekly':
                return `${d.getFullYear()}-W${Math.ceil((d.getDate() - d.getDay() + 1) / 7)}`;
            case 'monthly':
                return d.toISOString().slice(0, 7);
            default:
                return d.toISOString().slice(0, 10);
        }
    }
    getTimeStart(date, interval) {
        const d = new Date(date);
        switch (interval) {
            case 'hourly':
                d.setMinutes(0, 0, 0);
                return d;
            case 'daily':
                d.setHours(0, 0, 0, 0);
                return d;
            case 'weekly':
                d.setDate(d.getDate() - d.getDay());
                d.setHours(0, 0, 0, 0);
                return d;
            case 'monthly':
                d.setDate(1);
                d.setHours(0, 0, 0, 0);
                return d;
            default:
                return d;
        }
    }
    generateReportId() {
        return `rpt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    generateCacheKey(query) {
        return `analytics_${query.tenantId}_${query.type}_${query.startDate.getTime()}_${query.endDate.getTime()}`;
    }
    getCache(key) {
        const cached = this.cacheMap.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        this.cacheMap.delete(key);
        return null;
    }
    setCache(key, data) {
        this.cacheMap.set(key, {
            data,
            expiresAt: Date.now() + this.CACHE_TTL,
        });
    }
    clearCache(queryType) {
        if (!queryType) {
            this.cacheMap.clear();
        }
        else {
            Array.from(this.cacheMap.keys()).forEach((key) => {
                if (key.includes(queryType)) {
                    this.cacheMap.delete(key);
                }
            });
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map