import axios from 'axios';
import { createHash } from 'crypto';
import qs from 'querystring';
import format from 'date-fns/format';
import formatISO from 'date-fns/formatISO';
import parse from 'date-fns/parse';
import debug from 'debug';
import { MemberDidNotBindCard, CheckoutWithMemberIdFailed } from './errors/Payment';

const debugPayment = debug('ECPayGateway:Payment');

interface PaymentConstructorOptions {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  development?: boolean;
}

interface BasicPaymentPayload {
  MerchantID: string;
  MerchantTradeNo: string;
  MerchantTradeDate: string;
  PaymentType: string;
  TotalAmount: number;
  TradeDesc: string;
  ItemName: string;
  ReturnURL: string;
  ChoosePayment: string;
  NeedExtraPaidInfo: string;
  EncryptType: number;
  BindingCard?: number;
  MerchantMemberID?: string;
  ClientBackURL: string;
}

export interface CheckoutItem {
  name: string;
  unit?: string;
  unitPrice: number;
  amount: number;
}

export class PaymentGateway {
  HOST: string;
  MERCHANT_ID: string;
  HASH_KEY: string;
  HASH_IV: string;

  constructor(
    { merchantId, hashKey, hashIv, development }: PaymentConstructorOptions = {
      merchantId: '2000214',
      hashKey: '5294y06JbISpM5x9',
      hashIv: 'v77hoKGq4kWxNNIS',
      development: true,
    }
  ) {
    this.HOST = development ? 'https://payment-stage.ecpay.com.tw' : 'https://payment.ecpay.com.tw';
    this.MERCHANT_ID = merchantId;
    this.HASH_KEY = hashKey;
    this.HASH_IV = hashIv;
  }

  addCheckSum(payload: any) {
    return {
      ...payload,
      CheckMacValue: createHash('sha256')
        .update(
          encodeURIComponent(
            [
              ['HashKey', this.HASH_KEY],
              ...Object.entries(payload).sort(([aKey], [bKey]) => (aKey.toLowerCase() < bKey.toLowerCase() ? -1 : 1)),
              ['HashIV', this.HASH_IV],
            ]
              .map(([key, value]) => `${key}=${value}`)
              .join('&')
          )
            .toLowerCase()
            .replace(/'/g, '%27')
            .replace(/~/g, '%7e')
            .replace(/%20/g, '+')
        )
        .digest('hex')
        .toUpperCase(),
    };
  }

  createOrder({
    orderId,
    memberId,
    replyURL,
    items,
    description,
    amount,
    finishURL,
  }: {
    orderId: string;
    memberId?: string;
    replyURL: string;
    items: Array<string>;
    description: string;
    amount: number;
    finishURL?: string;
  }): {
    url: string;
    params: { [key: string]: string };
  } {
    const payload: BasicPaymentPayload = {
      MerchantID: this.MERCHANT_ID,
      MerchantTradeNo: orderId,
      MerchantTradeDate: format(new Date(), 'yyyy/MM/dd HH:mm:ss'),
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

  createBindProcedure(
    memberId: string,
    replyURL: string,
    finishURL?: string
  ): {
    url: string;
    params: { [key: string]: string };
  } {
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

  async checkoutWithMemberId(
    memberId: number,
    orderId: string,
    amount: number,
    description: string
  ): Promise<{
    checkoutTime: string | null;
    ecPayTradeNumber: string;
    authOrderNumber: string;
    authCode: string;
    firstSixNumber: string;
    lastFourNumber: string;
    vbv: number;
  }> {
    const { id } = await this.getMemberBoundCard(memberId);

    const payload = this.addCheckSum({
      MerchantID: this.MERCHANT_ID,
      MerchantMemberID: `${this.MERCHANT_ID}${memberId}`,
      MerchantTradeNo: orderId,
      MerchantTradeDate: format(new Date(), 'yyyy/MM/dd HH:mm:ss'),
      TotalAmount: Math.floor(amount),
      TradeDesc: description,
      CardID: id,
      stage: 0,
    });

    const { data } = await axios({
      method: 'post',
      url: `${this.HOST}/MerchantMember/AuthCardID/V2`,
      data: payload,
    });

    const {
      RtnCode,
      RtnMsg,
      AllpayTradeNo,
      gwsr,
      process_date,
      auth_code,
      card6no,
      card4no,
      eci,
    }: {
      RtnCode?: string;
      RtnMsg?: string;
      AllpayTradeNo?: string;
      gwsr?: string;
      process_date?: string;
      auth_code?: string;
      card6no?: string;
      card4no?: string;
      eci?: string;
    } = qs.parse(data);

    if (Number(RtnCode) === 1) {
      return {
        checkoutTime: process_date
          ? format(parse(process_date, 'yyyy/MM/dd HH:mm:ss', new Date()), 'yyyy-MM-dd HH:mm:ss')
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

    throw new CheckoutWithMemberIdFailed();
  }

  async getMemberBoundCard(
    memberId: number
  ): Promise<{
    id: string;
    cardNumber: string;
    bindOn: string;
  }> {
    const { data } = await axios({
      method: 'post',
      url: `${this.HOST}/MerchantMember/QueryMemberBinding`,
      data: this.addCheckSum({
        MerchantID: this.MERCHANT_ID,
        MerchantMemberId: `${this.MERCHANT_ID}${memberId}`,
      }),
    });

    const { JSonData }: { JSonData?: string } = qs.parse(data);

    if (JSonData) {
      try {
        const {
          BindingDate,
          CardID,
          Card6No,
          Card4No,
        }: {
          BindingDate: string;
          CardID: string;
          Card6No: string;
          Card4No: string;
        } = JSON.parse(JSonData);

        if (BindingDate !== '') {
          return {
            id: CardID,
            bindOn: formatISO(parse(BindingDate, 'yyyy/MM/dd HH:mm:ss', new Date())),
            cardNumber: `${Card6No.substr(0, 4)}-${Card6No.substr(4, 2)}xx-xxxx-${Card4No}`,
          };
        }

        throw new MemberDidNotBindCard();
      } catch (ex) {
        throw new MemberDidNotBindCard();
      }
    }

    throw new MemberDidNotBindCard();
  }
}
