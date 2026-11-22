export type GstType = 'CGST_SGST' | 'IGST' | 'NONE';

export type PaymentMode = 'TO_BE_BILLED' | 'TO_PAY' | 'PAID';

export type CompanyId = 'KRL' | 'KTC';

export interface BiltyRecord {
  id: string;
  companyId?: CompanyId;
  lrNo: string;
  date: string; // YYYY-MM-DD or DD-MM-YYYY
  fromCity: string;
  toCity: string;
  vehicleSize: string;
  vehicleNo: string;

  // Consignor (Sender)
  consignorName: string;
  consignorGst: string;
  consignorAddress: string;

  // Consignee (Receiver)
  consigneeName: string;
  consigneeGst: string;
  consigneeAddress: string;

  // Goods details
  goodsDescription: string;
  quantity: string;
  sealNumber: string;
  netWeight: string;
  invoiceNo: string;
  invoiceValue: string;
  eWayBillNo: string;
  inDate: string;

  // Financials
  freight: number;
  otherCharges: number;
  otherChargesLabel?: string;
  total: number;
  gstType: GstType;
  gstRate: number; // e.g., 18 or 5
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  advance: number;
  balance: number;
  paymentMode: PaymentMode;

  driverName?: string;
  driverPhone?: string;
  packages?: string;
  packingType?: string;
  remarks?: string;
  partyName?: string;
  isShared?: boolean;
  sharedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  routes: string;
  address: string;
  email: string;
  phone: string;
  gstin: string;
  jurisdiction: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  logoMonogram: string;
  disclaimer1: string;
  disclaimer2: string;
  disclaimer3: string;
  signText: string;
  city?: string;
  defaultFromCity?: string;
  defaultToCity?: string;
}
