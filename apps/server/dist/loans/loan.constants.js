"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PENALTY_RATE_PER_DAY = exports.MIN_INTEREST_RATE = exports.MAX_INTEREST_RATE = exports.DEFAULT_INTEREST_RATE = exports.LOAN_STATUSES = void 0;
exports.LOAN_STATUSES = {
    PENDING_REVIEW: 'PENDING_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    IN_PROGRESS: 'IN_PROGRESS',
    LATE_PAYMENT: 'LATE_PAYMENT',
    PAID: 'PAID',
};
exports.DEFAULT_INTEREST_RATE = 0.07;
exports.MAX_INTEREST_RATE = 0.18;
exports.MIN_INTEREST_RATE = 0.03;
exports.PENALTY_RATE_PER_DAY = 0.0008;
//# sourceMappingURL=loan.constants.js.map