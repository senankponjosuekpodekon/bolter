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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AnalyticsService = class AnalyticsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.cacheMap = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
    }
    async generateReport(query) {
        if (!query.type || !query.startDate || !query.endDate) {
            throw new common_1.BadRequestException('Missing required report parameters: type, startDate, endDate');
        }
        if (new Date(query.startDate) >= new Date(query.endDate)) {
            throw new common_1.BadRequestException('startDate must be before endDate');
        }
        const cacheKey = this.generateCacheKey(query);
        const cached = this.getCache(cacheKey);
        if (cached) {
            return cached;
        }
        let data = [];
        let rawCount = 0;
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
            default:
                throw new common_1.BadRequestException(`Unknown report type: ${query.type}`);
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
        return result;
    }
    async getTransactionAnalytics(query) {
        const supabaseClient = this.supabaseService.getClient();
        let queryBuilder = supabaseClient
            .from('transactions')
            .select('id, amount, status, created_at, category')
            .eq('tenant_id', query.tenantId)
            .gte('created_at', query.startDate.toISOString())
            .lte('created_at', query.endDate.toISOString());
        if (query.filters?.status) {
            queryBuilder = queryBuilder.eq('status', query.filters.status);
        }
        const { data, error } = await queryBuilder;
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch transaction data: ${error.message}`);
        const aggregated = this.aggregateData(data || [], query.groupBy || ['status'], query.aggregation || 'sum');
        return { data: aggregated, rawCount: data?.length || 0 };
    }
    async getUserAnalytics(query) {
        const supabaseClient = this.supabaseService.getClient();
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, created_at, status')
            .eq('tenant_id', query.tenantId)
            .gte('created_at', query.startDate.toISOString())
            .lte('created_at', query.endDate.toISOString());
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch user data: ${error.message}`);
        const aggregated = this.aggregateData(data || [], query.groupBy || ['status'], 'count');
        return { data: aggregated, rawCount: data?.length || 0 };
    }
    async getKycAnalytics(query) {
        const supabaseClient = this.supabaseService.getClient();
        const { data, error } = await supabaseClient
            .from('kyc_documents')
            .select('id, status, created_at, document_type')
            .eq('tenant_id', query.tenantId)
            .gte('created_at', query.startDate.toISOString())
            .lte('created_at', query.endDate.toISOString());
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch KYC data: ${error.message}`);
        const aggregated = this.aggregateData(data || [], query.groupBy || ['status'], 'count');
        return { data: aggregated, rawCount: data?.length || 0 };
    }
    async getLoanAnalytics(query) {
        const supabaseClient = this.supabaseService.getClient();
        const { data, error } = await supabaseClient
            .from('loans')
            .select('id, amount, status, created_at, loan_type')
            .eq('tenant_id', query.tenantId)
            .gte('created_at', query.startDate.toISOString())
            .lte('created_at', query.endDate.toISOString());
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch loan data: ${error.message}`);
        const aggregated = this.aggregateData(data || [], query.groupBy || ['status'], query.aggregation || 'sum');
        return { data: aggregated, rawCount: data?.length || 0 };
    }
    async getAccountAnalytics(query) {
        const supabaseClient = this.supabaseService.getClient();
        const { data, error } = await supabaseClient
            .from('accounts')
            .select('id, balance, currency, created_at, account_type')
            .eq('tenant_id', query.tenantId)
            .gte('created_at', query.startDate.toISOString())
            .lte('created_at', query.endDate.toISOString());
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch account data: ${error.message}`);
        const aggregated = this.aggregateData(data || [], query.groupBy || ['account_type'], query.aggregation || 'sum');
        return { data: aggregated, rawCount: data?.length || 0 };
    }
    aggregateData(data, groupByFields, aggregation) {
        const aggregated = {};
        data.forEach((record) => {
            const key = groupByFields.map((field) => record[field]).join('_');
            if (!aggregated[key]) {
                aggregated[key] = {
                    segment: key,
                    records: [],
                    timestamp: new Date(record.created_at || record.updated_at || new Date()),
                };
            }
            aggregated[key].records = [...aggregated[key].records, record];
        });
        return Object.values(aggregated).map((group) => ({
            timestamp: new Date(group.timestamp),
            segment: group.segment,
            value: this.performAggregation(group.records, aggregation),
        }));
    }
    performAggregation(records, aggregation) {
        const values = records
            .map((r) => r.amount || r.balance || 1)
            .filter((v) => typeof v === 'number');
        if (values.length === 0)
            return 0;
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
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map