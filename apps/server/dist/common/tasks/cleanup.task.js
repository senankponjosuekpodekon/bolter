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
var CleanupTaskService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupTaskService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const data_cleanup_service_1 = require("../services/data-cleanup.service");
let CleanupTaskService = CleanupTaskService_1 = class CleanupTaskService {
    constructor(dataCleanupService) {
        this.dataCleanupService = dataCleanupService;
        this.logger = new common_1.Logger(CleanupTaskService_1.name);
    }
    async purgeSoftDeletedRecords() {
        try {
            this.logger.log('Starting purge of soft-deleted records (90+ days)...');
            const result = await this.dataCleanupService.purgeSoftDeletedRecords();
            this.logger.log(`Purge completed: ${result.accountsPurged} accounts and ${result.usersPurged} users permanently deleted`);
        }
        catch (error) {
            this.logger.error('Failed to purge soft-deleted records:', error);
        }
    }
    async runPurgeNow() {
        return this.dataCleanupService.purgeSoftDeletedRecords();
    }
};
exports.CleanupTaskService = CleanupTaskService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupTaskService.prototype, "purgeSoftDeletedRecords", null);
exports.CleanupTaskService = CleanupTaskService = CleanupTaskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_cleanup_service_1.DataCleanupService])
], CleanupTaskService);
//# sourceMappingURL=cleanup.task.js.map