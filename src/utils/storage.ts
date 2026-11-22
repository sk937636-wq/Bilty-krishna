import { BiltyRecord, CompanyProfile } from '../types';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'KRISHNA ROADLINES',
  tagline: "FLEET ONWER & TRANSPORT CONTRACTOR'S",
  routes: 'DAILY SERVICE : DELHI, UP, HARYANA, RAJASTHAN, GUJRAT AND ALL OVER INDIA',
  address: 'J-152 A, SECTOR-9, VIJAY NAGAR, GHAZIABAD, UTTAR PRADESH',
  email: 'KRISHNAROADLINES38@GMAIL.COM',
  phone: '9540003838',
  gstin: '09DZWPS1204Q1ZE',
  jurisdiction: 'SUBJECT TO GUATAM BUDH NAGAR JURISDICTION ONLY',
  bankName: 'IDBI BANK LTD - SEC 63 NOIDA',
  bankAccountNo: '0200102000032203',
  bankIfsc: 'IBKL0000200',
  logoMonogram: 'KRL',
  disclaimer1: 'PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS NOT THE RESPONSIBILITY OF THE TRANSPORTER',
  disclaimer2: 'FOR TRANSPORTER NOT RESPONSIBLE FOR LEAKAGE BREAKAGE AND DAMAGE',
  disclaimer3: 'PLEASE CHECK THE ATTACHED INVOICE FOR MORE INFORMATION',
  signText: 'FOR KRISHNA ROADLINES',
};

export const KTC_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'KRISHNA TRANSPORT COMPANY',
  tagline: "FLEET ONWER & TRANSPORT CONTRACTOR'S",
  routes: 'DAILY SERVICE : DELHI, UP, HARYANA, RAJASTHAN, GUJRAT AND ALL OVER INDIA',
  address: 'J-152 A, SECTOR-9, VIJAY NAGAR, GHAZIABAD, UTTAR PRADESH',
  email: 'KRISHNATRANSPORTCOMPANY26@GMAIL.COM',
  phone: '9540002626',
  gstin: '09BIEPD4696Q1ZH',
  jurisdiction: 'SUBJECT TO GUATAM BUDH NAGAR JURISDICTION ONLY',
  bankName: 'IDBI BANK LTD - SEC 63 NOIDA',
  bankAccountNo: '0200102000036014',
  bankIfsc: 'IBKL0000200',
  logoMonogram: 'KTC',
  disclaimer1: 'PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS NOT THE RESPONSIBILITY OF THE TRANSPORTER',
  disclaimer2: 'FOR TRANSPORTER NOT RESPONSIBLE FOR LEAKAGE BREAKAGE AND DAMAGE',
  disclaimer3: 'PLEASE CHECK THE ATTACHED INVOICE FOR MORE INFORMATION',
  signText: 'FOR KRISHNA TRANSPORT COMPANY',
};

const STORAGE_KEYS = {
  RECORDS: 'transport_bilty_records_v1',
  COMPANY: 'transport_bilty_company_v1',
  LAST_LR: 'transport_bilty_last_lr_v1',
};

export const INITIAL_SAMPLE_RECORDS: BiltyRecord[] = [
  {
    id: 'sample-lr-7974',
    lrNo: '7974',
    date: '2026-09-15',
    fromCity: 'GHAZIABAD',
    toCity: 'JAIPUR',
    vehicleSize: '22 FEET',
    vehicleNo: 'UP14PT7105',
    consignorName: 'SHREE GANESH ENTERPRISES',
    consignorGst: '09AAACG1234F1Z8',
    consignorAddress: 'PLOT NO 45, INDUSTRIAL AREA, BULANDSHAHR ROAD, GHAZIABAD',
    consigneeName: 'RAJASTHAN INDUSTRIAL SOLUTIONS',
    consigneeGst: '08BBBPR5678H1Z2',
    consigneeAddress: 'F-12, VKI AREA, ROAD NO 9, JAIPUR, RAJASTHAN',
    goodsDescription: 'ELECTRICAL CABLES & HARDWARE APPLIANCES',
    quantity: '180 BOXES',
    sealNumber: 'KRL-9921',
    netWeight: '8.450 MT',
    invoiceNo: 'INV/26-27/0412',
    invoiceValue: '₹ 8,45,000',
    eWayBillNo: '541298450123',
    inDate: '2026-09-15',
    freight: 28500,
    otherCharges: 500,
    total: 29000,
    gstType: 'IGST',
    gstRate: 18,
    sgstAmount: 0,
    cgstAmount: 0,
    igstAmount: 5220,
    grandTotal: 34220,
    advance: 10000,
    balance: 24220,
    paymentMode: 'TO_BE_BILLED',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

export function getStoredCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (raw) {
      return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load company profile from storage', e);
  }
  return DEFAULT_COMPANY_PROFILE;
}

export function saveStoredCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save company profile', e);
  }
}

export function getStoredBiltyRecords(): BiltyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load bilty records', e);
  }
  // Initialize with initial sample if nothing exists
  saveStoredBiltyRecords(INITIAL_SAMPLE_RECORDS);
  return INITIAL_SAMPLE_RECORDS;
}

export function saveStoredBiltyRecords(records: BiltyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save bilty records', e);
  }
}

/**
 * Intelligent LR Auto-increment helper:
 * E.g., if last LR was "7974", next is "7975".
 * If last LR was "102", next is "103".
 * If last LR was "LR-102", next is "LR-103".
 */
export function getNextLrNumber(records: BiltyRecord[], manualLastLr?: string): string {
  // If user passed a specific last LR string
  const candidates: string[] = [];
  if (manualLastLr?.trim()) {
    candidates.push(manualLastLr.trim());
  }

  // Also check all existing records (newest created or highest numeric value)
  if (records.length > 0) {
    // Sort by createdAt desc or parse numeric
    const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    candidates.push(sorted[0].lrNo);
  }

  const lastStored = localStorage.getItem(STORAGE_KEYS.LAST_LR);
  if (lastStored) {
    candidates.push(lastStored);
  }

  if (candidates.length === 0) {
    return '101';
  }

  const baseStr = candidates[0];

  // Regex to match trailing number or pure number
  const match = baseStr.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const nextNum = parseInt(numStr, 10) + 1;
    // Keep zero-padding if original had leading zeroes (e.g., 00102 -> 00103)
    const padded = nextNum.toString().padStart(numStr.length, '0');
    return `${prefix}${padded}`;
  }

  // If no digits found at end, check if any number exists inside
  const anyDigits = baseStr.match(/\d+/g);
  if (anyDigits && anyDigits.length > 0) {
    const lastNum = anyDigits[anyDigits.length - 1];
    const nextNum = (parseInt(lastNum, 10) + 1).toString();
    return baseStr.replace(new RegExp(`${lastNum}$`), nextNum);
  }

  return `${baseStr}-1`;
}

export function saveLastLrNumber(lrNo: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_LR, lrNo.trim());
  } catch (e) {
    console.error('Failed to save last LR', e);
  }
}
