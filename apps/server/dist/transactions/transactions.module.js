"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const transactions_controller_1 = require("./transactions.controller");
const transactions_service_1 = require("./transactions.service");
const accounts_module_1 = require("../accounts/accounts.module");
const transaction_filter_service_1 = require("./transaction-filter.service");
const supabase_module_1 = require("../supabase/supabase.module");
const users_module_1 = require("../users/users.module");
let TransactionsModule = class TransactionsModule {
};
exports.TransactionsModule = TransactionsModule;
exports.TransactionsModule = TransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [accounts_module_1.AccountsModule, supabase_module_1.SupabaseModule, users_module_1.UsersModule],
        controllers: [transactions_controller_1.TransactionsController],
        providers: [transactions_service_1.TransactionsService, transaction_filter_service_1.TransactionFilterService],
        exports: [transactions_service_1.TransactionsService, transaction_filter_service_1.TransactionFilterService],
    })
], TransactionsModule);
//# sourceMappingURL=transactions.module.js.map