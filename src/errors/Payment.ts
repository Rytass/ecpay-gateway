export class InvalidNaturalCarrierNumberType extends Error {
  message: string = this.message || 'Invalid Natural Carrier Number Type';

  code = 1001;
}

export class InvalidMobileCarrierNumberType extends Error {
  message: string = this.message || 'Invalid Mobile Carrier Number Type';

  code = 1002;
}

export class MobileBarcodeVerificationSystemInMaintenance extends Error {
  message: string = this.message || 'Mobile Barcode Verification System In Maintenance';

  code = 1003;
}

export class MobileBarcodeVerificationSystemError extends Error {
  message: string = this.message || 'Mobile Barcode Verification System Error';

  code = 1004;
}

export class InvalidMobileBarcode extends Error {
  message: string = this.message || 'Invalid Mobile Barcode';

  code = 1005;
}

export class LoveCodeVerificationSystemInMaintenance extends Error {
  message: string = this.message || 'Love Code Verification System In Maintenance';

  code = 1006;
}

export class LoveCodeVerificationSystemError extends Error {
  message: string = this.message || 'Love Code Verification System Error';

  code = 1007;
}

export class InvalidLoveCode extends Error {
  message: string = this.message || 'Invalid Love Code';

  code = 1008;
}

export class IssueInvoiceFailed extends Error {
  message: string = this.message || 'Issue Invoice Failed';

  code = 1009;
}

export class SendInvoiceNotificationFailed extends Error {
  message: string = this.message || 'Send Invoice Notification Failed';

  code = 1010;
}

export class AllowanceInvoiceFailed extends Error {
  message: string = this.message || 'Allowance Invoice Failed';

  code = 1011;
}

export class InvalidInvoiceFailed extends Error {
  message: string = this.message || 'Invalid Invoice Failed';

  code = 1012;
}

export class InvalidAllowanceFailed extends Error {
  message: string = this.message || 'Invalid Allowance Failed';

  code = 1013;
}

export class MemberDidNotBindCard extends Error {
  message: string = this.message || 'Member Did Not Bind Card';

  code = 1014;
}

export class CheckoutWithMemberIdFailed extends Error {
  message: string = this.message || 'Checkout With Member Id Failed';

  code = 1015;
}
