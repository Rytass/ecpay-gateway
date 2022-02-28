export declare enum InvoiceCarrierType {
    PRINT = 0,
    LOVE_CODE = 1,
    GERRN_WORLD = 2,
    NATURAL = 3,
    MOBILE = 4
}
interface InvoiceConstructorOptions {
    merchantId: string;
    hashKey: string;
    hashIv: string;
    development?: boolean;
}
interface InvoiceCustomer {
    memberId: number;
    VATNumber?: string;
    name: string;
    address?: string | null;
    mobilePhone: string;
    email: string;
}
interface InvoiceCarrier {
    type: InvoiceCarrierType;
    loveCode?: string | null;
    number?: string | null;
}
interface InvoiceItem {
    amount: number;
    unitPrice: number;
    name: string;
    unit?: string;
}
interface IssueInvoiceArguments {
    orderId: string;
    customer: InvoiceCustomer;
    carrier: InvoiceCarrier;
    items: Array<InvoiceItem>;
}
interface IssueInvoiceResponse {
    orderId: string;
    invoiceNumber: string;
    date: string;
    randomNumber: string;
}
interface AllowanceInvoiceArguments {
    invoiceNumber: string;
    invoiceDate: string;
    items: Array<InvoiceItem>;
    email: string | undefined;
}
interface IssueInvoiceResponseAllowanceResponse {
    allowanceNumber: string;
    invoiceNumber: string;
    date: string;
    remainingAmount: number;
}
interface InvalidInvoiceArguments {
    invoiceNumber: string;
    invoiceDate: string;
    reason: string;
}
interface InvalidAllowanceArguments {
    invoiceNumber: string;
    allowanceNumber: string;
    reason: string;
}
export declare class Invoice {
    taxRatio: number;
    yearMonth: string;
    number: string;
    prefix: string;
    randomCode: string;
    createdAt: string;
    buyerVAT: string | undefined;
    sellerVAT: string;
    items: Array<InvoiceItem>;
    hashKey: string;
    hashIv: string;
    constructor({ number, prefix, randomCode, createdAt, buyerVAT, sellerVAT, items, }: {
        number: string;
        prefix: string;
        randomCode: string;
        createdAt: string;
        buyerVAT?: string;
        sellerVAT: string;
        items: Array<InvoiceItem>;
    });
    get totalTaxFreePrice(): number;
    get totalPrice(): number;
    get yearMonthText(): string;
    get barcodeText(): string;
    get invoiceNumber(): string;
    get firstQRCodeText(): string;
    get secondQRCodeText(): string;
}
export declare class InvoiceGateway {
    HOST: string;
    MERCHANT_ID: string;
    HASH_KEY: string;
    HASH_IV: string;
    static getCarrierTypeCode(type: InvoiceCarrierType): string;
    constructor({ merchantId, hashKey, hashIv, development }?: InvoiceConstructorOptions);
    encrypt(data: any): string;
    decrypt(encryptedData: string): any;
    getValidCarrierNumber(type: InvoiceCarrierType, number: string | null | undefined): Promise<string> | string;
    getValidLoveCode(loveCode: string | null | undefined): Promise<string>;
    getValidMobileCarrierNumber(number: string): Promise<string>;
    sendNotification(invoiceNumber: string, email: string): Promise<void>;
    invalidAllowance({ invoiceNumber, allowanceNumber, reason }: InvalidAllowanceArguments): Promise<void>;
    invalidInvoice({ invoiceNumber, invoiceDate, reason }: InvalidInvoiceArguments): Promise<void>;
    allowanceInvoice({ invoiceNumber, invoiceDate, items, email, }: AllowanceInvoiceArguments): Promise<IssueInvoiceResponseAllowanceResponse>;
    issueInvoice({ orderId, customer: { memberId, VATNumber, name, address, mobilePhone, email }, carrier: { type: carrierType, loveCode, number: carrierNumber }, items, }: IssueInvoiceArguments): Promise<IssueInvoiceResponse>;
}
export {};
