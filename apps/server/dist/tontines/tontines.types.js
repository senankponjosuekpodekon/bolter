"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.ContributionStatus = exports.CycleStatus = exports.DistributionMethod = exports.TontineMemberStatus = exports.TontineStatus = void 0;
var TontineStatus;
(function (TontineStatus) {
    TontineStatus["PENDING"] = "PENDING";
    TontineStatus["ACTIVE"] = "ACTIVE";
    TontineStatus["PAUSED"] = "PAUSED";
    TontineStatus["COMPLETED"] = "COMPLETED";
    TontineStatus["CANCELLED"] = "CANCELLED";
})(TontineStatus || (exports.TontineStatus = TontineStatus = {}));
var TontineMemberStatus;
(function (TontineMemberStatus) {
    TontineMemberStatus["ACTIVE"] = "ACTIVE";
    TontineMemberStatus["SUSPENDED"] = "SUSPENDED";
    TontineMemberStatus["WITHDREW"] = "WITHDREW";
    TontineMemberStatus["INACTIVE"] = "INACTIVE";
})(TontineMemberStatus || (exports.TontineMemberStatus = TontineMemberStatus = {}));
var DistributionMethod;
(function (DistributionMethod) {
    DistributionMethod["MANUAL_ORDER"] = "MANUAL_ORDER";
    DistributionMethod["RANDOM"] = "RANDOM";
    DistributionMethod["SENIORITY"] = "SENIORITY";
    DistributionMethod["LOTTERY"] = "LOTTERY";
})(DistributionMethod || (exports.DistributionMethod = DistributionMethod = {}));
var CycleStatus;
(function (CycleStatus) {
    CycleStatus["PENDING"] = "PENDING";
    CycleStatus["ACTIVE"] = "ACTIVE";
    CycleStatus["COMPLETED"] = "COMPLETED";
    CycleStatus["CANCELLED"] = "CANCELLED";
})(CycleStatus || (exports.CycleStatus = CycleStatus = {}));
var ContributionStatus;
(function (ContributionStatus) {
    ContributionStatus["PENDING"] = "PENDING";
    ContributionStatus["PAID"] = "PAID";
    ContributionStatus["LATE"] = "LATE";
    ContributionStatus["WAIVED"] = "WAIVED";
    ContributionStatus["CANCELLED"] = "CANCELLED";
})(ContributionStatus || (exports.ContributionStatus = ContributionStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["WALLET"] = "WALLET";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
//# sourceMappingURL=tontines.types.js.map