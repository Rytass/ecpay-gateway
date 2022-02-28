"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGateway = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const crypto_1 = require("crypto");
const querystring_1 = tslib_1.__importDefault(require("querystring"));
const format_1 = tslib_1.__importDefault(require("date-fns/format"));
const formatISO_1 = tslib_1.__importDefault(require("date-fns/formatISO"));
const parse_1 = tslib_1.__importDefault(require("date-fns/parse"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const Payment_1 = require("./errors/Payment");
const debugPayment = debug_1.default('ECPayGateway:Payment');
class PaymentGateway {
    constructor({ merchantId, hashKey, hashIv, development } = {
        merchantId: '2000214',
        hashKey: '5294y06JbISpM5x9',
        hashIv: 'v77hoKGq4kWxNNIS',
        development: true,
    }) {
        this.HOST = development ? 'https://payment-stage.ecpay.com.tw' : 'https://payment.ecpay.com.tw';
        this.MERCHANT_ID = merchantId;
        this.HASH_KEY = hashKey;
        this.HASH_IV = hashIv;
    }
    addCheckSum(payload) {
        return Object.assign(Object.assign({}, payload), { CheckMacValue: crypto_1.createHash('sha256')
                .update(encodeURIComponent([
                ['HashKey', this.HASH_KEY],
                ...Object.entries(payload).sort(([aKey], [bKey]) => (aKey.toLowerCase() < bKey.toLowerCase() ? -1 : 1)),
                ['HashIV', this.HASH_IV],
            ]
                .map(([key, value]) => `${key}=${value}`)
                .join('&'))
                .toLowerCase()
                .replace(/'/g, '%27')
                .replace(/~/g, '%7e')
                .replace(/%20/g, '+'))
                .digest('hex')
                .toUpperCase() });
    }
    createOrder({ orderId, memberId, replyURL, items, description, amount, finishURL, }) {
        const payload = {
            MerchantID: this.MERCHANT_ID,
            MerchantTradeNo: orderId,
            MerchantTradeDate: format_1.default(new Date(), 'yyyy/MM/dd HH:mm:ss'),
            PaymentType: 'aio',
            TotalAmount: Math.floor(amount),
            TradeDesc: description,
            ItemName: items.join('#'),
            ReturnURL: replyURL,
            ChoosePayment: 'Credit',
            NeedExtraPaidInfo: 'Y',
            EncryptType: 1,
            ClientBackURL: finishURL || '',
        };
        if (memberId) {
            payload.BindingCard = 1;
            payload.MerchantMemberID = `${this.MERCHANT_ID}${memberId}`;
        }
        return {
            url: `${this.HOST}/Cashier/AioCheckOut/V5`,
            params: this.addCheckSum(payload),
        };
    }
    createBindProcedure(memberId, replyURL, finishURL) {
        return {
            url: `${this.HOST}/MerchantMember/BindingCardID`,
            params: this.addCheckSum({
                MerchantID: this.MERCHANT_ID,
                MerchantMemberID: `${this.MERCHANT_ID}${memberId}`,
                ServerReplyURL: replyURL,
                ClientRedirectURL: finishURL || '',
            }),
        };
    }
    checkoutWithMemberId(memberId, orderId, amount, description) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { id } = yield this.getMemberBoundCard(memberId);
            const payload = this.addCheckSum({
                MerchantID: this.MERCHANT_ID,
                MerchantMemberID: `${this.MERCHANT_ID}${memberId}`,
                MerchantTradeNo: orderId,
                MerchantTradeDate: format_1.default(new Date(), 'yyyy/MM/dd HH:mm:ss'),
                TotalAmount: Math.floor(amount),
                TradeDesc: description,
                CardID: id,
                stage: 0,
            });
            const { data } = yield axios_1.default({
                method: 'post',
                url: `${this.HOST}/MerchantMember/AuthCardID/V2`,
                data: payload,
            });
            const { RtnCode, RtnMsg, AllpayTradeNo, gwsr, process_date, auth_code, card6no, card4no, eci, } = querystring_1.default.parse(data);
            if (Number(RtnCode) === 1) {
                return {
                    checkoutTime: process_date
                        ? format_1.default(parse_1.default(process_date, 'yyyy/MM/dd HH:mm:ss', new Date()), 'yyyy-MM-dd HH:mm:ss')
                        : null,
                    ecPayTradeNumber: AllpayTradeNo || '',
                    authOrderNumber: gwsr || '',
                    authCode: auth_code || '',
                    firstSixNumber: card6no || '',
                    lastFourNumber: card4no || '',
                    vbv: Number(eci || 0),
                };
            }
            debugPayment(`(${RtnCode}) ${RtnMsg}`);
            throw new Payment_1.CheckoutWithMemberIdFailed();
        });
    }
    getMemberBoundCard(memberId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios_1.default({
                method: 'post',
                url: `${this.HOST}/MerchantMember/QueryMemberBinding`,
                data: this.addCheckSum({
                    MerchantID: this.MERCHANT_ID,
                    MerchantMemberId: `${this.MERCHANT_ID}${memberId}`,
                }),
            });
            const { JSonData } = querystring_1.default.parse(data);
            if (JSonData) {
                try {
                    const { BindingDate, CardID, Card6No, Card4No, } = JSON.parse(JSonData);
                    if (BindingDate !== '') {
                        return {
                            id: CardID,
                            bindOn: formatISO_1.default(parse_1.default(BindingDate, 'yyyy/MM/dd HH:mm:ss', new Date())),
                            cardNumber: `${Card6No.substr(0, 4)}-${Card6No.substr(4, 2)}xx-xxxx-${Card4No}`,
                        };
                    }
                    throw new Payment_1.MemberDidNotBindCard();
                }
                catch (ex) {
                    throw new Payment_1.MemberDidNotBindCard();
                }
            }
            throw new Payment_1.MemberDidNotBindCard();
        });
    }
}
exports.PaymentGateway = PaymentGateway;
//# sourceMappingURL=Payment.js.map