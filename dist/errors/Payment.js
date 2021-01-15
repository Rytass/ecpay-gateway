"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutWithMemberIdFailed = exports.MemberDidNotBindCard = exports.InvalidAllowanceFailed = exports.InvalidInvoiceFailed = exports.AllowanceInvoiceFailed = exports.SendInvoiceNotificationFailed = exports.IssueInvoiceFailed = exports.InvalidLoveCode = exports.LoveCodeVerificationSystemError = exports.LoveCodeVerificationSystemInMaintenance = exports.InvalidMobileBarcode = exports.MobileBarcodeVerificationSystemError = exports.MobileBarcodeVerificationSystemInMaintenance = exports.InvalidMobileCarrierNumberType = exports.InvalidNaturalCarrierNumberType = void 0;
class InvalidNaturalCarrierNumberType extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Natural Carrier Number Type';
        this.code = 1001;
    }
}
exports.InvalidNaturalCarrierNumberType = InvalidNaturalCarrierNumberType;
class InvalidMobileCarrierNumberType extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Mobile Carrier Number Type';
        this.code = 1002;
    }
}
exports.InvalidMobileCarrierNumberType = InvalidMobileCarrierNumberType;
class MobileBarcodeVerificationSystemInMaintenance extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Mobile Barcode Verification System In Maintenance';
        this.code = 1003;
    }
}
exports.MobileBarcodeVerificationSystemInMaintenance = MobileBarcodeVerificationSystemInMaintenance;
class MobileBarcodeVerificationSystemError extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Mobile Barcode Verification System Error';
        this.code = 1004;
    }
}
exports.MobileBarcodeVerificationSystemError = MobileBarcodeVerificationSystemError;
class InvalidMobileBarcode extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Mobile Barcode';
        this.code = 1005;
    }
}
exports.InvalidMobileBarcode = InvalidMobileBarcode;
class LoveCodeVerificationSystemInMaintenance extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Love Code Verification System In Maintenance';
        this.code = 1006;
    }
}
exports.LoveCodeVerificationSystemInMaintenance = LoveCodeVerificationSystemInMaintenance;
class LoveCodeVerificationSystemError extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Love Code Verification System Error';
        this.code = 1007;
    }
}
exports.LoveCodeVerificationSystemError = LoveCodeVerificationSystemError;
class InvalidLoveCode extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Love Code';
        this.code = 1008;
    }
}
exports.InvalidLoveCode = InvalidLoveCode;
class IssueInvoiceFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Issue Invoice Failed';
        this.code = 1009;
    }
}
exports.IssueInvoiceFailed = IssueInvoiceFailed;
class SendInvoiceNotificationFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Send Invoice Notification Failed';
        this.code = 1010;
    }
}
exports.SendInvoiceNotificationFailed = SendInvoiceNotificationFailed;
class AllowanceInvoiceFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Allowance Invoice Failed';
        this.code = 1011;
    }
}
exports.AllowanceInvoiceFailed = AllowanceInvoiceFailed;
class InvalidInvoiceFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Invoice Failed';
        this.code = 1012;
    }
}
exports.InvalidInvoiceFailed = InvalidInvoiceFailed;
class InvalidAllowanceFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Invalid Allowance Failed';
        this.code = 1013;
    }
}
exports.InvalidAllowanceFailed = InvalidAllowanceFailed;
class MemberDidNotBindCard extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Member Did Not Bind Card';
        this.code = 1014;
    }
}
exports.MemberDidNotBindCard = MemberDidNotBindCard;
class CheckoutWithMemberIdFailed extends Error {
    constructor() {
        super(...arguments);
        this.message = this.message || 'Checkout With Member Id Failed';
        this.code = 1015;
    }
}
exports.CheckoutWithMemberIdFailed = CheckoutWithMemberIdFailed;
//# sourceMappingURL=Payment.js.map