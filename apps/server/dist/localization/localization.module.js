"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalizationModule = void 0;
const common_1 = require("@nestjs/common");
const localization_service_1 = require("./localization.service");
const currency_formatter_1 = require("./formatters/currency.formatter");
const date_formatter_1 = require("./formatters/date.formatter");
const number_formatter_1 = require("./formatters/number.formatter");
let LocalizationModule = class LocalizationModule {
};
exports.LocalizationModule = LocalizationModule;
exports.LocalizationModule = LocalizationModule = __decorate([
    (0, common_1.Module)({
        providers: [localization_service_1.LocalizationService, currency_formatter_1.CurrencyFormatter, date_formatter_1.DateFormatter, number_formatter_1.NumberFormatter],
        exports: [localization_service_1.LocalizationService, currency_formatter_1.CurrencyFormatter, date_formatter_1.DateFormatter, number_formatter_1.NumberFormatter],
    })
], LocalizationModule);
//# sourceMappingURL=localization.module.js.map