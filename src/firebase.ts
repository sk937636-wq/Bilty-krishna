import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { BiltyRecord, CompanyProfile } from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || 'celebrity888-222-db';
export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  firestoreDatabaseId
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  if (
    errStr.includes('offline') ||
    errStr.includes('unavailable') ||
    errStr.includes('timeout') ||
    errStr.includes('backends') ||
    errStr.includes('Could not reach')
  ) {
    console.warn('Firestore offline/network warning (running in local storage fallback mode):', errStr);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or unreachable.');
    }
    return false;
  }
}

// Auth Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim();
  const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  return res.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  } catch (error) {
    console.error('Email registration error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Sanitize bilty record to ensure strict Firestore matching
function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeBilty(bilty: BiltyRecord): Record<string, unknown> {
  // Ensure valid ID without special illegal characters and within 128 chars
  const safeId = (bilty.id || `bilty-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  const now = Date.now();
  return {
    id: safeId,
    companyId: bilty.companyId === 'KTC' ? 'KTC' : 'KRL',
    lrNo: String(bilty.lrNo || '').slice(0, 64),
    date: String(bilty.date || '').slice(0, 32),
    fromCity: String(bilty.fromCity || '').slice(0, 128),
    toCity: String(bilty.toCity || '').slice(0, 128),
    vehicleSize: String(bilty.vehicleSize || '').slice(0, 64),
    vehicleNo: String(bilty.vehicleNo || '').slice(0, 64),
    consignorName: String(bilty.consignorName || '').slice(0, 256),
    consignorGst: String(bilty.consignorGst || '').slice(0, 64),
    consignorAddress: String(bilty.consignorAddress || '').slice(0, 512),
    consigneeName: String(bilty.consigneeName || '').slice(0, 256),
    consigneeGst: String(bilty.consigneeGst || '').slice(0, 64),
    consigneeAddress: String(bilty.consigneeAddress || '').slice(0, 512),
    goodsDescription: String(bilty.goodsDescription || '').slice(0, 512),
    quantity: String(bilty.quantity || '').slice(0, 128),
    sealNumber: String(bilty.sealNumber || '').slice(0, 64),
    netWeight: String(bilty.netWeight || '').slice(0, 64),
    invoiceNo: String(bilty.invoiceNo || '').slice(0, 128),
    invoiceValue: String(bilty.invoiceValue || '').slice(0, 128),
    eWayBillNo: String(bilty.eWayBillNo || '').slice(0, 128),
    inDate: String(bilty.inDate || '').slice(0, 32),
    freight: safeNum(bilty.freight, 0),
    otherCharges: safeNum(bilty.otherCharges, 0),
    total: safeNum(bilty.total, 0),
    gstType: String(bilty.gstType || 'IGST').slice(0, 32),
    gstRate: safeNum(bilty.gstRate, 0),
    sgstAmount: safeNum(bilty.sgstAmount, 0),
    cgstAmount: safeNum(bilty.cgstAmount, 0),
    igstAmount: safeNum(bilty.igstAmount, 0),
    grandTotal: safeNum(bilty.grandTotal, 0),
    advance: safeNum(bilty.advance, 0),
    balance: safeNum(bilty.balance, 0),
    paymentMode: String(bilty.paymentMode || 'TO_BE_BILLED').slice(0, 64),
    remarks: String(bilty.remarks || '').slice(0, 512),
    partyName: String(bilty.partyName || '').slice(0, 256),
    isShared: Boolean(bilty.isShared),
    sharedAt: safeNum(bilty.sharedAt, 0),
    createdAt: safeNum(bilty.createdAt, now),
    updatedAt: safeNum(bilty.updatedAt, now),
  };
}

// Helper to get collection name based on company ('krl' or 'ktc')
export function getBiltyCollection(companyId?: string): string {
  return companyId === 'KTC' ? 'ktc' : 'krl';
}

// Save or Update Bilty to Cloud Firestore in separate 'krl' or 'ktc' collection
export async function saveBiltyToCloud(bilty: BiltyRecord): Promise<void> {
  const safePayload = sanitizeBilty(bilty);
  const docId = String(safePayload.id);
  const colName = getBiltyCollection(bilty.companyId);
  const path = `${colName}/${docId}`;
  try {
    await setDoc(doc(db, colName, docId), safePayload);
    // Cleanup from the opposite collection or legacy 'bilties' if moving or re-saving
    const oppositeCol = colName === 'ktc' ? 'krl' : 'ktc';
    try {
      await deleteDoc(doc(db, oppositeCol, docId));
    } catch (_) {}
    try {
      await deleteDoc(doc(db, 'bilties', docId));
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Bilty from Cloud Firestore
export async function deleteBiltyFromCloud(biltyId: string, companyId?: string): Promise<void> {
  const safeId = biltyId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const colName = getBiltyCollection(companyId);
  const path = `${colName}/${safeId}`;
  try {
    await deleteDoc(doc(db, colName, safeId));
    // Also cleanup from opposite collection and legacy 'bilties' just in case
    const oppositeCol = colName === 'ktc' ? 'krl' : 'ktc';
    try { await deleteDoc(doc(db, oppositeCol, safeId)); } catch (_) {}
    try { await deleteDoc(doc(db, 'bilties', safeId)); } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save Company Profile to Cloud Firestore
export async function saveCompanyProfileToCloud(profile: CompanyProfile): Promise<void> {
  const path = 'settings/company_profile';
  try {
    await setDoc(doc(db, 'settings', 'company_profile'), {
      companyName: String(profile.companyName || '').slice(0, 256),
      tagline: String(profile.tagline || '').slice(0, 256),
      routes: String(profile.routes || '').slice(0, 512),
      address: String(profile.address || '').slice(0, 512),
      email: String(profile.email || '').slice(0, 128),
      phone: String(profile.phone || '').slice(0, 64),
      gstin: String(profile.gstin || '').slice(0, 64),
      jurisdiction: String(profile.jurisdiction || '').slice(0, 256),
      bankName: String(profile.bankName || '').slice(0, 128),
      bankAccountNo: String(profile.bankAccountNo || '').slice(0, 64),
      bankIfsc: String(profile.bankIfsc || '').slice(0, 64),
      logoMonogram: String(profile.logoMonogram || '').slice(0, 32),
      disclaimer1: String(profile.disclaimer1 || '').slice(0, 512),
      disclaimer2: String(profile.disclaimer2 || '').slice(0, 512),
      disclaimer3: String(profile.disclaimer3 || '').slice(0, 512),
      signText: String(profile.signText || '').slice(0, 128),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to real-time Bilties from Cloud Firestore across 'krl' and 'ktc' collections
export function subscribeToCloudBilties(
  onUpdate: (records: BiltyRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let krlRecords: BiltyRecord[] = [];
  let ktcRecords: BiltyRecord[] = [];
  let legacyRecords: BiltyRecord[] = [];
  let unsubKrl: (() => void) | null = null;
  let unsubKtc: (() => void) | null = null;
  let unsubLegacy: (() => void) | null = null;

  const stopListeners = () => {
    if (unsubKrl) {
      unsubKrl();
      unsubKrl = null;
    }
    if (unsubKtc) {
      unsubKtc();
      unsubKtc = null;
    }
    if (unsubLegacy) {
      unsubLegacy();
      unsubLegacy = null;
    }
  };

  const emitAll = () => {
    const map = new Map<string, BiltyRecord>();
    for (const r of krlRecords) map.set(r.id, r);
    for (const r of ktcRecords) map.set(r.id, r);
    for (const r of legacyRecords) {
      if (!map.has(r.id)) map.set(r.id, r);
    }
    const combined = Array.from(map.values());
    combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onUpdate(combined);
  };

  const startListeners = () => {
    stopListeners();

    // 1. Subscribe to 'krl' collection
    unsubKrl = onSnapshot(
      collection(db, 'krl'),
      (snapshot) => {
        krlRecords = [];
        snapshot.forEach((d) => {
          krlRecords.push({ ...d.data(), companyId: 'KRL' } as BiltyRecord);
        });
        emitAll();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'krl');
        if (onError) onError(error);
      }
    );

    // 2. Subscribe to 'ktc' collection
    unsubKtc = onSnapshot(
      collection(db, 'ktc'),
      (snapshot) => {
        ktcRecords = [];
        snapshot.forEach((d) => {
          ktcRecords.push({ ...d.data(), companyId: 'KTC' } as BiltyRecord);
        });
        emitAll();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ktc');
        if (onError) onError(error);
      }
    );

    // 3. Migrate legacy 'bilties' collection documents into 'krl' or 'ktc'
    unsubLegacy = onSnapshot(
      collection(db, 'bilties'),
      (snapshot) => {
        legacyRecords = [];
        snapshot.forEach(async (d) => {
          const data = d.data() as BiltyRecord;
          const companyId = data.companyId === 'KTC' ? 'KTC' : 'KRL';
          const targetCol = companyId === 'KTC' ? 'ktc' : 'krl';
          try {
            const safePayload = sanitizeBilty({ ...data, id: d.id, companyId });
            await setDoc(doc(db, targetCol, String(safePayload.id)), safePayload);
            await deleteDoc(doc(db, 'bilties', d.id));
          } catch (_) {
            legacyRecords.push(data);
          }
        });
        emitAll();
      },
      (error) => {
        console.warn('Legacy bilties sync notice:', error);
      }
    );
  };

  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      startListeners();
    } else {
      stopListeners();
    }
  });

  return () => {
    unsubAuth();
    stopListeners();
  };
}

// Subscribe to real-time Company Profile from Cloud Firestore
export function subscribeToCloudCompanyProfile(
  onUpdate: (profile: CompanyProfile) => void
): () => void {
  const path = 'settings/company_profile';
  return onSnapshot(
    doc(db, 'settings', 'company_profile'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CompanyProfile);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Test connection on boot
testFirestoreConnection();
