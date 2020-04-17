import { v4 as uuid } from 'uuid';
import axios from 'axios';
import crypto from 'crypto';
import debug from 'debug';
import {
  InvalidNaturalCarrierNumberType,
  InvalidMobileCarrierNumberType,
  MobileBarcodeVerificationSystemInMaintenance,
  MobileBarcodeVerificationSystemError,
  InvalidMobileBarcode,
  LoveCodeVerificationSystemInMaintenance,
  LoveCodeVerificationSystemError,
  InvalidLoveCode,
  IssueInvoiceFailed,
  SendInvoiceNotificationFailed,
  AllowanceInvoiceFailed,
  InvalidInvoiceFailed,
  InvalidAllowanceFailed,
} from './errors/Payment';

const debugInvoice = debug('ECPayGateway:Invoice');

export enum InvoiceCarrierType {
  // eslint-disable-next-line no-unused-vars
  PRINT,
  // eslint-disable-next-line no-unused-vars
  LOVE_CODE,
  // eslint-disable-next-line no-unused-vars
  GERRN_WORLD,
  // eslint-disable-next-line no-unused-vars
  NATURAL,
  // eslint-disable-next-line no-unused-vars
  MOBILE,
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
  price: number;
  name: string;
  unit: string;
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
  email: string;
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

const NODE_ENV = process.env.NODE_ENV || 'development';

export class Invoice {
  HOST: string;
  MERCHANT_ID: string;
  HASH_KEY: string;
  HASH_IV: string;

  static getCarrierTypeCode(type: InvoiceCarrierType): string {
    switch (type) {
      case InvoiceCarrierType.GERRN_WORLD:
        return '1';

      case InvoiceCarrierType.NATURAL:
        return '2';

      case InvoiceCarrierType.MOBILE:
        return '3';

      case InvoiceCarrierType.LOVE_CODE:
      default:
        return '';
    }
  }

  constructor(
    { merchantId, hashKey, hashIv, development }: InvoiceConstructorOptions = {
      merchantId: '2000132',
      hashKey: 'ejCk326UnaZWKisg',
      hashIv: 'q9jcZX8Ib9LM8wYk',
      development: true,
    }
  ) {
    this.HOST = development
      ? 'https://einvoice-stage.ecpay.com.tw/B2CInvoice'
      : 'https://einvoice.ecpay.com.tw/B2CInvoice';
    this.MERCHANT_ID = merchantId;
    this.HASH_KEY = hashKey;
    this.HASH_IV = hashIv;
  }

  encrypt(data: any): string {
    const encodedData = encodeURIComponent(JSON.stringify(data));
    const cipher = crypto.createCipheriv('aes-128-cbc', this.HASH_KEY, this.HASH_IV);
    cipher.setAutoPadding(true);

    return [cipher.update(encodedData, 'utf8', 'base64'), cipher.final('base64')].join('');
  }

  decrypt(encryptedData: string): any {
    const decipher = crypto.createDecipheriv('aes-128-cbc', this.HASH_KEY, this.HASH_IV);

    return JSON.parse(
      decodeURIComponent([decipher.update(encryptedData, 'base64', 'utf8'), decipher.final('utf8')].join(''))
    );
  }

  getValidCarrierNumber(type: InvoiceCarrierType, number: string | null | undefined): Promise<string> | string {
    switch (type) {
      case InvoiceCarrierType.MOBILE:
        if (!number || !/^\/[0-9A-Z+-.]{7}$/.test(number)) throw new InvalidMobileCarrierNumberType();
        return this.getValidMobileCarrierNumber(number);

      case InvoiceCarrierType.NATURAL:
        if (!number || !/^[A-Z]{2}\d{14}$/.test(number)) throw new InvalidNaturalCarrierNumberType();
        return number;

      case InvoiceCarrierType.GERRN_WORLD:
      case InvoiceCarrierType.LOVE_CODE:
      default:
        return '';
    }
  }

  async getValidLoveCode(loveCode: string | null | undefined): Promise<string> {
    if (!loveCode) throw new InvalidLoveCode();

    const ts = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/CheckLoveCode`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: ts,
          RqId: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          LoveCode: loveCode,
        }),
      },
    });

    const { RtnCode, IsExist } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        if (IsExist === 'Y') return loveCode;

        throw new InvalidLoveCode();

      case 100000100:
        debugInvoice('Love Code Verification System Maintenance');

        throw new LoveCodeVerificationSystemInMaintenance();

      default:
        debugInvoice('Love Code Verification System Error', RtnCode);

        throw new LoveCodeVerificationSystemError();
    }
  }

  async getValidMobileCarrierNumber(number: string): Promise<string> {
    const ts = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/CheckBarcode`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: ts,
          RqId: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          BarCode: number,
        }),
      },
    });

    const { RtnCode, IsExist } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        if (IsExist === 'Y') return number;

        throw new InvalidMobileBarcode();

      case 100000100:
        debugInvoice('Mobile Barcode Verification System Maintenance');

        throw new MobileBarcodeVerificationSystemInMaintenance();

      default:
        debugInvoice('Mobile Barcode Verification System Error', RtnCode);

        throw new MobileBarcodeVerificationSystemError();
    }
  }

  async sendNotification(invoiceNumber: string, email: string) {
    const ts = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/InvoiceNotify`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: ts,
          RqId: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          InvoiceNo: invoiceNumber,
          NotifyMail: email,
          Notify: 'E',
          InvoiceTag: 'I',
          Notified: 'A',
        }),
      },
    });

    const {
      RtnCode,
      RtnMsg,
    }: {
      RtnCode: number;
      RtnMsg: string;
    } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        debugInvoice('Invoice Notification Sent!', invoiceNumber);
        break;

      default:
        debugInvoice(`${RtnCode} ${RtnMsg}`);

        throw new SendInvoiceNotificationFailed();
    }
  }

  async invalidAllowance({ invoiceNumber, allowanceNumber, reason }: InvalidAllowanceArguments): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/AllowanceInvalid`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: timestamp,
          RqID: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          InvoiceNo: invoiceNumber,
          AllowanceNo: allowanceNumber,
          Reason: reason,
        }),
      },
    });

    const {
      RtnCode,
      RtnMsg,
    }: {
      RtnCode: number;
      RtnMsg: string;
    } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        break;

      default:
        debugInvoice(`${RtnCode} ${RtnMsg}`);

        throw new InvalidAllowanceFailed();
    }
  }

  async invalidInvoice({ invoiceNumber, invoiceDate, reason }: InvalidInvoiceArguments): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/Invalid`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: timestamp,
          RqID: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          InvoiceNo: invoiceNumber,
          InvoiceDate: invoiceDate,
          Reason: reason,
        }),
      },
    });

    const {
      RtnCode,
      RtnMsg,
    }: {
      RtnCode: number;
      RtnMsg: string;
    } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        break;

      default:
        debugInvoice(`${RtnCode} ${RtnMsg}`);

        throw new InvalidInvoiceFailed();
    }
  }

  async allowanceInvoice({
    invoiceNumber,
    invoiceDate,
    items,
    email,
  }: AllowanceInvoiceArguments): Promise<IssueInvoiceResponseAllowanceResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/Allowance`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: timestamp,
          RqID: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          InvoiceNo: invoiceNumber,
          InvoiceDate: invoiceDate,
          AllowanceNotify: 'E',
          NotifyMail: email,
          AllowanceAmount: items.reduce((sum, item) => sum + item.price * item.amount, 0),
          Items: items.map((item, index) => ({
            ItemSeq: index,
            ItemName: item.name,
            ItemCount: item.amount,
            ItemWord: item.unit,
            ItemPrice: item.price,
            ItemTaxType: '1',
            ItemAmount: item.amount * item.price,
            ItemRemark: '',
          })),
        }),
      },
    });

    const {
      RtnCode,
      RtnMsg,
      IA_Allow_No: allowanceNumber,
      IA_Date: date,
      IA_Remain_Allowance_Amt: remainingAmount,
    }: {
      RtnCode: number;
      RtnMsg: string;
      IA_Allow_No: string;
      IA_Date: string;
      IA_Remain_Allowance_Amt: number;
    } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        return {
          allowanceNumber,
          invoiceNumber,
          date,
          remainingAmount,
        };

      default:
        debugInvoice(`${RtnCode} ${RtnMsg}`);

        throw new AllowanceInvoiceFailed();
    }
  }

  async issueInvoice({
    orderId,
    customer: { memberId, VATNumber, name, address, mobilePhone, email },
    carrier: { type: carrierType, loveCode, number: carrierNumber },
    items,
  }: IssueInvoiceArguments): Promise<IssueInvoiceResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    const id = uuid();

    const {
      data: { Data },
    } = await axios({
      method: 'post',
      url: `${this.HOST}/Issue`,
      data: {
        MerchantID: this.MERCHANT_ID,
        RqHeader: {
          Timestamp: timestamp,
          RqID: id,
          Revision: '3.0.0',
        },
        Data: this.encrypt({
          MerchantID: this.MERCHANT_ID,
          RelateNumber: orderId,
          CustomerID: `${memberId}`,
          CustomerIdentifier: VATNumber || '',
          CustomerName: name,
          CustomerAddr: address || '',
          CustomerPhone: mobilePhone,
          CustomerEmail: email,
          Print: carrierType === InvoiceCarrierType.PRINT ? '1' : '0',
          Donation: carrierType === InvoiceCarrierType.LOVE_CODE ? '1' : '0',
          LoveCode: carrierType === InvoiceCarrierType.LOVE_CODE ? await this.getValidLoveCode(loveCode) : '',
          CarrierType: Invoice.getCarrierTypeCode(carrierType),
          CarrierNum: await this.getValidCarrierNumber(carrierType, carrierNumber),
          TaxType: '1',
          SalesAmount: items.reduce((sum, item) => sum + item.price * item.amount, 0),
          InvoiceRemark: '',
          Items: items.map((item, index) => ({
            ItemSeq: index,
            ItemName: item.name,
            ItemCount: item.amount,
            ItemWord: item.unit,
            ItemPrice: item.price,
            ItemTaxType: '1',
            ItemAmount: item.amount * item.price,
            ItemRemark: '',
          })),
          InvType: '07',
          vat: '1',
        }),
      },
    });

    const {
      RtnCode,
      RtnMsg,
      InvoiceNo,
      InvoiceDate,
      RandomNumber,
    }: {
      RtnCode: number;
      RtnMsg: string;
      InvoiceNo?: string;
      InvoiceDate?: string;
      RandomNumber?: string;
    } = this.decrypt(Data);

    switch (RtnCode) {
      case 1:
        if (InvoiceNo && InvoiceDate && RandomNumber) {
          if (NODE_ENV !== 'production') {
            this.sendNotification(InvoiceNo, email);
          }

          return {
            orderId,
            invoiceNumber: InvoiceNo,
            date: InvoiceDate,
            randomNumber: RandomNumber,
          };
        }

        throw new IssueInvoiceFailed();

      default:
        debugInvoice(`${RtnCode} ${RtnMsg}`);

        throw new IssueInvoiceFailed();
    }
  }
}
