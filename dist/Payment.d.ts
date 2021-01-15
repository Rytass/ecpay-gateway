interface PaymentConstructorOptions {
    merchantId: string;
    hashKey: string;
    hashIv: string;
    development?: boolean;
}
export interface CheckoutItem {
    name: string;
    unit?: string;
    unitPrice: number;
    amount: number;
}
export declare class PaymentGateway {
    HOST: string;
    MERCHANT_ID: string;
    HASH_KEY: string;
    HASH_IV: string;
    constructor({ merchantId, hashKey, hashIv, development }?: PaymentConstructorOptions);
    addCheckSum(payload: any): any;
    createOrder({ orderId, memberId, replyURL, items, description, amount, finishURL, }: {
        orderId: string;
        memberId?: string;
        replyURL: string;
        items: Array<string>;
        description: string;
        amount: number;
        finishURL?: string;
    }): {
        url: string;
        params: {
            [key: string]: string;
        };
    };
    createBindProcedure(memberId: string, replyURL: string, finishURL?: string): {
        url: string;
        params: {
            [key: string]: string;
        };
    };
    checkoutWithMemberId(memberId: number, orderId: string, amount: number, description: string): Promise<{
        checkoutTime: string | null;
        ecPayTradeNumber: string;
        authOrderNumber: string;
        authCode: string;
        firstSixNumber: string;
        lastFourNumber: string;
        vbv: number;
    }>;
    getMemberBoundCard(memberId: number): Promise<{
        id: string;
        cardNumber: string;
        bindOn: string;
    }>;
}
export {};
