import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import {
  Role,
  Currency,
  Transaction,
  FixedExpense,
  Subscription,
  StockHolding,
  NextMonthPlanItem,
  FamilyDatabasePayload,
  StagedSmsItem,
  ReceiptData,
  CardCode,
} from '../types/finance';
import { INITIAL_DATA } from '../constants/initialData';
import { recalculateCardBalances, getTxMonthKey, smartCategorizeExpense, normalizeMerchantName, extractSmsDate } from '../utils/smsParser';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';

const STORAGE_KEY = 'spendiq_family_db_v4';
const DEFAULT_CLOUD_URL = 'https://spendiq-7de3d.firebaseapp.com';

interface FinanceContextType {
  role: Role;
  setRole: (r: Role) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  activeView: string;
  setActiveView: (v: string) => void;
  cardFilter: 'ALL' | 'ICICI' | 'AXIS';
  setCardFilter: (f: 'ALL' | 'ICICI' | 'AXIS') => void;
  selectedCalDay: number;
  setSelectedCalDay: (d: number) => void;
  targetAllowance: number;
  setTargetAllowance: (a: number) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  inspectingCategory: string | null;
  setInspectingCategory: (cat: string | null) => void;
  openCategoryInspector: (cat: string) => void;

  // Data & Real-Time Sync
  data: FamilyDatabasePayload;
  cloudDbUrl: string;
  setCloudDbUrl: (url: string) => void;
  dbStatusMsg: string;
  isCloudSyncing: boolean;
  isFirestoreConnected: boolean;

  // Modals & Navigation
  activeModal: string | null;
  openModal: (modalName: string) => void;
  closeModal: () => void;
  editingTxId: string | null;
  setEditingTxId: (id: string | null) => void;
  selectedTxForReceipt: Transaction | null;
  setSelectedTxForReceipt: (tx: Transaction | null) => void;
  openReceiptScannerForTx: (tx?: Transaction | null) => void;
  openReceiptDetailForTx: (tx: Transaction) => void;
  attachReceiptToTransaction: (txId: string, receiptData: ReceiptData) => void;
  recordTransactionFromReceipt: (receiptData: ReceiptData, cardCode?: CardCode) => Transaction;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Actions
  addTransactions: (staged: StagedSmsItem[]) => number;
  updateTransaction: (id: string, updated: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  smartRecategorizeAll: () => void;
  updateCardBalancesOverride: (iciciBal: number, iciciNextDate: string, axisLimit: number, axisNextDate: string) => void;
  toggleFixedExpense: (id: string) => void;
  addFixedExpense: (name: string, amountJpy: number, due: string, card: string) => void;
  deleteFixedExpense: (id: string) => void;
  addSubscription: (name: string, cycle: string, amountJpy: number, card: string, status: string) => void;
  deleteSubscription: (id: string) => void;
  addStock: (ticker: string, name: string, units: string, valueJpy: number, gain: string) => void;
  deleteStock: (id: string) => void;
  addNextMonthItem: (item: Omit<NextMonthPlanItem, 'id'>) => void;
  toggleNextMonthItem: (id: string) => void;
  deleteNextMonthItem: (id: string) => void;
  importFixedToNextMonth: () => void;
  resetNextMonthPlan: () => void;
  setNextMonthTarget: (targetMonth: string, daysInMonth: number) => void;
  setCalendarDayNote: (day: string, title: string, type: 'spend' | 'reload' | 'fixed') => void;

  // Cloud & Reset
  pushToCloud: (showFeedback?: boolean) => Promise<boolean>;
  pullFromCloud: (showFeedback?: boolean) => Promise<boolean>;
  exportSyncCode: () => string;
  importSyncCode: (base64Str: string) => boolean;
  resetToDefault: () => void;
  wipeToBlankSlate: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function deduplicateTransactions(txs: Transaction[]): Transaction[] {
  if (!Array.isArray(txs)) return [];
  const seenIds = new Set<string>();
  const seenFp = new Set<string>();
  const res: Transaction[] = [];
  for (const t of txs) {
    if (!t) continue;
    if (t.id && seenIds.has(t.id)) continue;
    if (t.id) seenIds.add(t.id);
    const fp = `${(t.merchant || '').toUpperCase()}|${t.date || ''}|${Number(t.amountJpy) || 0}|${t.cardCode || ''}|${t.smsBalance ?? ''}`;
    if (seenFp.has(fp)) continue;
    seenFp.add(fp);
    res.push(t);
  }
  return res;
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('DAD');
  const [currency, setCurrency] = useState<Currency>('JPY');
  const [selectedMonth, setSelectedMonth] = useState<string>('Oct-2026');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [cardFilter, setCardFilter] = useState<'ALL' | 'ICICI' | 'AXIS'>('ALL');
  const [selectedCalDay, setSelectedCalDay] = useState<number>(8);
  const [targetAllowance, setTargetAllowance] = useState<number>(75000);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [inspectingCategory, setInspectingCategory] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<number | null>(null);

  const [cloudDbUrl, setCloudDbUrlState] = useState<string>(DEFAULT_CLOUD_URL);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('Connecting Firestore...');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Prevent local write loops
  const isUpdatingFromRemoteRef = useRef<boolean>(false);

  // Initialize Core Data from fresh blank slate or local v4 storage
  const [data, setData] = useState<FamilyDatabasePayload>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.transactions)) {
          return {
            ...INITIAL_DATA,
            ...parsed,
            transactions: deduplicateTransactions(parsed.transactions),
          };
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_DATA;
  });

  const showToast = useCallback((msg: string) => {
    if (toastTimer) window.clearTimeout(toastTimer);
    setToastMessage(msg);
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    setToastTimer(timer);
  }, [toastTimer]);

  const openModal = useCallback((name: string) => {
    setActiveModal(name);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Persist locally
  const saveLocally = useCallback((newData: FamilyDatabasePayload) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // ignore
    }
  }, []);

  // Sync to Firestore and broadcast live to everyone
  const syncToFirestore = useCallback(async (payload: FamilyDatabasePayload) => {
    try {
      setIsCloudSyncing(true);
      const ledgerDocRef = doc(db, 'familyLedger', 'current');
      await setDoc(ledgerDocRef, payload);
      setIsFirestoreConnected(true);
      setDbStatusMsg(`Firestore Live (${payload.transactions.length} Tx)`);
    } catch (err) {
      console.warn('Could not sync to Firestore:', err);
      setIsFirestoreConnected(false);
      setDbStatusMsg(`Local Cached (${payload.transactions.length} Tx)`);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Real-time Firestore onSnapshot listener
  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function initFirestore() {
      try {
        // Test connection as instructed in Firebase guidelines
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch {
          // Normal if 'test/connection' doc doesn't exist; indicates server reached
        }

        const ledgerDocRef = doc(db, 'familyLedger', 'current');
        unsub = onSnapshot(
          ledgerDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const remote = snapshot.data() as FamilyDatabasePayload;
              if (remote && Array.isArray(remote.transactions)) {
                const mappedTxs = deduplicateTransactions(remote.transactions);
                isUpdatingFromRemoteRef.current = true;
                setData((current) => {
                  const { icici, axis } = recalculateCardBalances(
                    mappedTxs,
                    selectedMonth,
                    remote.icici || current.icici,
                    remote.axis || current.axis
                  );
                  const merged: FamilyDatabasePayload = {
                    ...INITIAL_DATA,
                    ...remote,
                    transactions: mappedTxs,
                    icici,
                    axis,
                  };
                  saveLocally(merged);
                  return merged;
                });
                setIsFirestoreConnected(true);
                setDbStatusMsg(`Firestore Live (${mappedTxs.length} Tx)`);
                setTimeout(() => {
                  isUpdatingFromRemoteRef.current = false;
                }, 100);
              }
            } else {
              // First time: initialize document with clean blank slate in Firestore
              setDoc(ledgerDocRef, INITIAL_DATA)
                .then(() => {
                  setIsFirestoreConnected(true);
                  setDbStatusMsg('Firestore Connected (Blank Slate)');
                })
                .catch((err) => {
                  handleFirestoreError(err, OperationType.WRITE, 'familyLedger/current');
                });
            }
          },
          (error) => {
            console.warn('Firestore onSnapshot notice:', error);
            setIsFirestoreConnected(false);
            setDbStatusMsg('Local Mode (Cloud Reconnecting)');
          }
        );
      } catch (err) {
        console.error('Failed to attach Firestore listener:', err);
        setIsFirestoreConnected(false);
        setDbStatusMsg('Local Mode');
      }
    }

    initFirestore();

    return () => {
      if (unsub) unsub();
    };
  }, [selectedMonth, saveLocally]);

  const openCategoryInspector = useCallback((cat: string) => {
    setInspectingCategory(cat);
    setActiveModal('categoryDetailModal');
  }, []);

  const openReceiptScannerForTx = useCallback((tx?: Transaction | null) => {
    setSelectedTxForReceipt(tx || null);
    setActiveModal('receiptScannerModal');
  }, []);

  const openReceiptDetailForTx = useCallback((tx: Transaction) => {
    setSelectedTxForReceipt(tx);
    setActiveModal('receiptDetailModal');
  }, []);

  const attachReceiptToTransaction = useCallback((txId: string, receiptData: ReceiptData) => {
    setData((prev) => {
      const newTxs = prev.transactions.map((tx) => {
        if (tx.id !== txId) return tx;
        return {
          ...tx,
          receipt: receiptData,
          category: (tx.category === 'Regular Transaction' || !tx.category) && receiptData.recommendedCategory
            ? receiptData.recommendedCategory
            : tx.category,
        };
      });
      const nextState: FamilyDatabasePayload = {
        ...prev,
        transactions: newTxs,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });
    showToast(`Visual Intelligence: Attached receipt for ${receiptData.storeName}!`);
  }, [saveLocally, syncToFirestore, showToast]);

  const recordTransactionFromReceipt = useCallback((receiptData: ReceiptData, cardCode?: CardCode): Transaction => {
    const card: CardCode = cardCode || (receiptData.cardLast4 === '7117' ? 'AXIS' : 'ICICI');
    const store = receiptData.storeName || 'MAXVALU COMONOKE';
    const amt = Number(receiptData.totalAmount) || 0;
    const cat = receiptData.recommendedCategory || 'Groceries & Supermarket';

    let dateStr = '26-Oct-2026';
    let ts = Date.now();
    if (receiptData.date) {
      const dObj = extractSmsDate(receiptData.date);
      dateStr = dObj.dateStr;
      ts = dObj.timestampMs;
    }

    const newTx: Transaction = {
      id: 'tx_rec_' + Date.now(),
      merchant: store.toUpperCase(),
      letter: store === '7-ELEVEN' ? '7' : (store.charAt(0).toUpperCase() || 'M'),
      iconBg: store.toLowerCase().includes('max') ? 'bg-emerald-600' : 'bg-zinc-800',
      subtext: receiptData.storeBranch ? `${receiptData.storeBranch}` : 'Visual Receipt Scan',
      category: cat,
      cardCode: card,
      cardUsed: card === 'AXIS' ? 'Axis Bank XX7117' : 'ICICI Forex XX0817',
      spender: role === 'DAD' ? 'Dad' : 'Son',
      date: dateStr,
      timestampMs: ts,
      amountJpy: card === 'AXIS' ? Math.round(amt * 1.8) : amt,
      amountInr: card === 'AXIS' ? amt : Math.round(amt / 1.8),
      receipt: receiptData,
      manualOverride: true,
    };

    const targetMonth = getTxMonthKey(newTx);
    setSelectedMonth(targetMonth);

    setData((prev) => {
      const updatedTxs = [newTx, ...prev.transactions].sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      const { icici, axis } = recalculateCardBalances(updatedTxs, targetMonth, prev.icici, prev.axis);
      const nextData: FamilyDatabasePayload = {
        ...prev,
        updatedAt: Date.now(),
        transactions: updatedTxs,
        icici,
        axis,
      };
      saveLocally(nextData);
      syncToFirestore(nextData);
      return nextData;
    });

    showToast(`Recorded new ${card} swipe for ${store} (¥${amt.toLocaleString()})!`);
    return newTx;
  }, [role, setSelectedMonth, saveLocally, syncToFirestore, showToast]);

  // Compute available months dynamically from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    data.transactions.forEach((t) => {
      const key = getTxMonthKey(t);
      if (key) set.add(key);
    });
    if (selectedMonth && selectedMonth !== 'ALL') {
      set.add(selectedMonth);
    }
    if (set.size === 0) {
      set.add('Oct-2026');
    }
    return Array.from(set);
  }, [data.transactions, selectedMonth]);

  const setCloudDbUrl = useCallback((url: string) => {
    setCloudDbUrlState(url);
  }, []);

  const pushToCloud = useCallback(async (showFeedback = true) => {
    try {
      setIsCloudSyncing(true);
      const ledgerDocRef = doc(db, 'familyLedger', 'current');
      await setDoc(ledgerDocRef, data);
      setIsFirestoreConnected(true);
      setDbStatusMsg(`Firestore Live (${data.transactions.length} Tx)`);
      if (showFeedback) showToast('Database pushed live to Google Cloud Firestore!');
      return true;
    } catch {
      if (showFeedback) showToast('Saved locally; could not push to Firestore');
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, [data, showToast]);

  const pullFromCloud = useCallback(async (showFeedback = true) => {
    try {
      setIsCloudSyncing(true);
      const ledgerDocRef = doc(db, 'familyLedger', 'current');
      const snap = await getDocFromServer(ledgerDocRef);
      if (snap.exists()) {
        const remote = snap.data() as FamilyDatabasePayload;
        if (remote && Array.isArray(remote.transactions)) {
          const mappedTxs = deduplicateTransactions(remote.transactions);
          const { icici, axis } = recalculateCardBalances(mappedTxs, selectedMonth, remote.icici || data.icici, remote.axis || data.axis);
          const merged: FamilyDatabasePayload = {
            ...INITIAL_DATA,
            ...remote,
            transactions: mappedTxs,
            icici,
            axis,
          };
          setData(merged);
          saveLocally(merged);
          setIsFirestoreConnected(true);
          setDbStatusMsg(`Firestore Live (${mappedTxs.length} Tx)`);
          if (showFeedback) showToast(`Synced ${mappedTxs.length} transactions from Firestore!`);
          return true;
        }
      }
    } catch {
      if (showFeedback) showToast('Failed to pull from Firestore');
    } finally {
      setIsCloudSyncing(false);
    }
    return false;
  }, [data, selectedMonth, saveLocally, showToast]);

  // Actions with Automatic Firestore Persistence
  const addTransactions = useCallback((staged: StagedSmsItem[]): number => {
    if (staged.length === 0) return 0;
    const colors = ['bg-[#10b981] text-white', 'bg-[#d97706] text-white', 'bg-[#f59e0b] text-black', 'bg-[#e11d48] text-white', 'bg-[#0d9488] text-white'];

    let targetMonth = selectedMonth;
    if (staged.length > 0) {
      const parsedMonth = getTxMonthKey({ date: staged[0].date } as Transaction);
      if (parsedMonth && selectedMonth !== 'ALL') {
        targetMonth = parsedMonth;
        setSelectedMonth(parsedMonth);
      }
    }

    setData((prev) => {
      const newTxs = [...prev.transactions];
      const newNotes = { ...prev.calendarNotes };

      staged.forEach((item, i) => {
        const iconBg = colors[(newTxs.length + i) % colors.length];
        const newTx: Transaction = {
          id: 'tx-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 6),
          merchant: item.merchant,
          letter: item.merchant.charAt(0) || 'S',
          iconBg,
          subtext: `${item.cardCode === 'AXIS' ? 'Axis Bank Card XX7117' : 'ICICI Bank Forex Prepaid Card XX0817'} • ${item.date}`,
          category: item.category,
          cardCode: item.cardCode,
          cardUsed: item.cardUsed,
          spender: item.spender,
          date: item.date,
          timestampMs: item.timestampMs,
          amountJpy: Number(item.amountJpy) || 0,
          amountInr: Number(item.amountInr) || Math.round((Number(item.amountJpy) || 0) / 1.8),
          smsBalance: item.smsBalance !== null && item.smsBalance !== undefined ? Number(item.smsBalance) : null,
          manualOverride: true,
        };
        newTxs.push(newTx);

        const dayNumMatch = item.date.match(/^(\d{1,2})/);
        if (dayNumMatch) {
          const dayNum = String(parseInt(dayNumMatch[1], 10));
          newNotes[dayNum] = {
            title: `${item.merchant.slice(0, 10)} ¥${Number(item.amountJpy).toLocaleString('en-US')}`,
            type: 'spend',
          };
        }
      });

      const deduplicated = deduplicateTransactions(newTxs).sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      const { icici, axis } = recalculateCardBalances(deduplicated, targetMonth, prev.icici, prev.axis);

      const nextState: FamilyDatabasePayload = {
        ...prev,
        transactions: deduplicated,
        calendarNotes: newNotes,
        icici,
        axis,
        updatedAt: Date.now(),
      };

      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });

    return staged.length;
  }, [selectedMonth, saveLocally, syncToFirestore]);

  const updateTransaction = useCallback((id: string, updated: Partial<Transaction>) => {
    setData((prev) => {
      const newTxs = prev.transactions.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...updated, manualOverride: true };
        if (updated.merchant) {
          merged.letter = merged.merchant === '7-ELEVEN' ? '7' : (merged.merchant.charAt(0) || 'T');
        }
        return merged;
      }).sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

      const { icici, axis } = recalculateCardBalances(newTxs, selectedMonth, prev.icici, prev.axis);
      const nextState = {
        ...prev,
        transactions: newTxs,
        icici,
        axis,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });
    showToast('Transaction updated & saved to Cloud!');
  }, [selectedMonth, saveLocally, syncToFirestore, showToast]);

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => {
      const removed = prev.transactions.find((t) => t.id === id);
      const newTxs = prev.transactions.filter((t) => t.id !== id);
      const { icici, axis } = recalculateCardBalances(newTxs, selectedMonth, prev.icici, prev.axis);
      const nextState = {
        ...prev,
        transactions: newTxs,
        icici,
        axis,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Deleted ${removed ? removed.merchant : 'transaction'} from Cloud`);
      return nextState;
    });
  }, [selectedMonth, saveLocally, syncToFirestore, showToast]);

  const smartRecategorizeAll = useCallback(() => {
    setData((prev) => {
      const recat = prev.transactions.map((t) => {
        const cleanM = normalizeMerchantName(t.merchant);
        return {
          ...t,
          merchant: cleanM,
          letter: cleanM === '7-ELEVEN' ? '7' : (cleanM.charAt(0) || 'R'),
          category: smartCategorizeExpense(cleanM, t.subtext || ''),
          manualOverride: false,
        };
      });
      const nextState = {
        ...prev,
        transactions: recat,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Smart-categorized all transactions!');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const updateCardBalancesOverride = useCallback((
    iciciBal: number,
    iciciNextDate: string,
    axisLimit: number,
    axisNextDate: string
  ) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        icici: {
          ...prev.icici,
          balanceJpy: iciciBal,
          nextDate: iciciNextDate,
          lastSyncInfo: 'Manual Admin Override',
        },
        axis: {
          ...prev.axis,
          balanceInr: axisLimit,
          nextDate: axisNextDate,
          lastSyncInfo: 'Manual Admin Override',
        },
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Card balances updated and synced to everyone!');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const toggleFixedExpense = useCallback((id: string) => {
    setData((prev) => {
      const nextExpenses = prev.fixedExpenses.map((f) => {
        if (f.id === id) return { ...f, active: !f.active };
        return f;
      });
      const nextState = {
        ...prev,
        fixedExpenses: nextExpenses,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });
  }, [saveLocally, syncToFirestore]);

  const addFixedExpense = useCallback((name: string, amountJpy: number, due: string, card: string) => {
    setData((prev) => {
      const newItem: FixedExpense = {
        id: 'fx-' + Date.now(),
        name,
        amountJpy,
        due: due || 'Due Monthly',
        card: card || 'ICICI Forex XX0817',
        active: true,
      };
      const nextState = {
        ...prev,
        fixedExpenses: [...prev.fixedExpenses, newItem],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Added fixed item "${name}"`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const deleteFixedExpense = useCallback((id: string) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        fixedExpenses: prev.fixedExpenses.filter((f) => f.id !== id),
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Removed fixed expense');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const addSubscription = useCallback((name: string, cycle: string, amountJpy: number, card: string, status: string) => {
    setData((prev) => {
      const newSub: Subscription = {
        id: 'sub-' + Date.now(),
        name,
        cycle: cycle || 'Monthly',
        amountJpy,
        card: card || 'ICICI Forex XX0817',
        status: status || 'Active Auto-Debit',
      };
      const nextState = {
        ...prev,
        subscriptions: [...prev.subscriptions, newSub],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Added subscription "${name}"`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const deleteSubscription = useCallback((id: string) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== id),
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Removed subscription');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const addStock = useCallback((ticker: string, name: string, units: string, valueJpy: number, gain: string) => {
    setData((prev) => {
      const newStk: StockHolding = {
        id: 'stk-' + Date.now(),
        ticker: ticker.toUpperCase(),
        name,
        units,
        valueJpy,
        gain: gain || '+0.0%',
      };
      const nextState = {
        ...prev,
        stocks: [...prev.stocks, newStk],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Added equity holding "${newStk.ticker}"`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const deleteStock = useCallback((id: string) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        stocks: prev.stocks.filter((s) => s.id !== id),
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Removed stock holding');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const addNextMonthItem = useCallback((item: Omit<NextMonthPlanItem, 'id'>) => {
    setData((prev) => {
      const newItem: NextMonthPlanItem = {
        ...item,
        id: 'nm-' + Date.now(),
      };
      const nextState = {
        ...prev,
        nextMonthPlan: [...prev.nextMonthPlan, newItem],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Added "${item.name}" to next month plan`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const toggleNextMonthItem = useCallback((id: string) => {
    setData((prev) => {
      const nextPlan = prev.nextMonthPlan.map((i) => {
        if (i.id === id) return { ...i, included: !i.included };
        return i;
      });
      const nextState = {
        ...prev,
        nextMonthPlan: nextPlan,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });
  }, [saveLocally, syncToFirestore]);

  const deleteNextMonthItem = useCallback((id: string) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        nextMonthPlan: prev.nextMonthPlan.filter((i) => i.id !== id),
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Removed next month planned expense');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const importFixedToNextMonth = useCallback(() => {
    setData((prev) => {
      const existingNames = new Set(prev.nextMonthPlan.map((p) => p.name.toLowerCase()));
      const toAdd: NextMonthPlanItem[] = [];
      prev.fixedExpenses.forEach((f) => {
        if (!existingNames.has(f.name.toLowerCase())) {
          toAdd.push({
            id: 'nm-pulled-' + Date.now() + '-' + f.id,
            name: f.name,
            type: f.name.includes('Rent') ? 'Lodging & Dorm Rent' : f.name.includes('Pass') ? 'Travel & Suica Pass' : 'Utilities & Wifi/SIM',
            amountJpy: f.amountJpy,
            whenOccurs: f.due,
            howPaid: f.card,
            included: true,
          });
        }
      });
      if (toAdd.length === 0) {
        showToast('All fixed items are already in next month plan');
        return prev;
      }
      const nextState = {
        ...prev,
        nextMonthPlan: [...prev.nextMonthPlan, ...toAdd],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Pulled ${toAdd.length} fixed expenses into next month plan`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const resetNextMonthPlan = useCallback(() => {
    setData((prev) => {
      const nextState = {
        ...prev,
        nextMonthPlan: [],
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast('Cleared next month plan');
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const setNextMonthTarget = useCallback((targetMonth: string, daysInMonth: number) => {
    setData((prev) => {
      const nextState = {
        ...prev,
        nextMonthConfig: {
          ...prev.nextMonthConfig,
          targetMonth,
          daysInMonth,
        },
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      return nextState;
    });
  }, [saveLocally, syncToFirestore]);

  const setCalendarDayNote = useCallback((day: string, title: string, type: 'spend' | 'reload' | 'fixed') => {
    setData((prev) => {
      const nextNotes = {
        ...prev.calendarNotes,
        [day]: { title, type },
      };
      const nextState = {
        ...prev,
        calendarNotes: nextNotes,
        updatedAt: Date.now(),
      };
      saveLocally(nextState);
      syncToFirestore(nextState);
      showToast(`Saved note for day ${day}`);
      return nextState;
    });
  }, [saveLocally, syncToFirestore, showToast]);

  const exportSyncCode = useCallback((): string => {
    try {
      const serializable = {
        ...data,
        updatedAt: Date.now(),
      };
      return btoa(unescape(encodeURIComponent(JSON.stringify(serializable))));
    } catch {
      return '';
    }
  }, [data]);

  const importSyncCode = useCallback((base64Str: string): boolean => {
    try {
      const decoded = decodeURIComponent(escape(atob(base64Str.trim())));
      const parsed = JSON.parse(decoded);
      if (parsed && Array.isArray(parsed.transactions)) {
        const mapped = deduplicateTransactions(parsed.transactions);
        const { icici, axis } = recalculateCardBalances(mapped, selectedMonth, parsed.icici || data.icici, parsed.axis || data.axis);
        const merged: FamilyDatabasePayload = {
          ...INITIAL_DATA,
          ...parsed,
          transactions: mapped,
          icici,
          axis,
          updatedAt: Date.now(),
        };
        setData(merged);
        saveLocally(merged);
        syncToFirestore(merged);
        showToast(`Loaded ${mapped.length} transactions from Sync Code!`);
        return true;
      }
    } catch {
      showToast('Invalid Family Sync Code format');
    }
    return false;
  }, [data, selectedMonth, saveLocally, syncToFirestore, showToast]);

  const resetToDefault = useCallback(() => {
    setData(INITIAL_DATA);
    saveLocally(INITIAL_DATA);
    syncToFirestore(INITIAL_DATA);
    showToast('Reset to clean blank slate');
  }, [saveLocally, syncToFirestore, showToast]);

  const wipeToBlankSlate = useCallback(async () => {
    setData(INITIAL_DATA);
    saveLocally(INITIAL_DATA);
    await syncToFirestore(INITIAL_DATA);
    showToast('Wiped database to a pristine blank slate!');
  }, [saveLocally, syncToFirestore, showToast]);

  return (
    <FinanceContext.Provider
      value={{
        role,
        setRole,
        currency,
        setCurrency,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        activeView,
        setActiveView,
        cardFilter,
        setCardFilter,
        selectedCalDay,
        setSelectedCalDay,
        targetAllowance,
        setTargetAllowance,
        selectedCategory,
        setSelectedCategory,
        inspectingCategory,
        setInspectingCategory,
        openCategoryInspector,
        data,
        cloudDbUrl,
        setCloudDbUrl,
        dbStatusMsg,
        isCloudSyncing,
        isFirestoreConnected,
        activeModal,
        openModal,
        closeModal,
        editingTxId,
        setEditingTxId,
        selectedTxForReceipt,
        setSelectedTxForReceipt,
        openReceiptScannerForTx,
        openReceiptDetailForTx,
        attachReceiptToTransaction,
        recordTransactionFromReceipt,
        toastMessage,
        showToast,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        smartRecategorizeAll,
        updateCardBalancesOverride,
        toggleFixedExpense,
        addFixedExpense,
        deleteFixedExpense,
        addSubscription,
        deleteSubscription,
        addStock,
        deleteStock,
        addNextMonthItem,
        toggleNextMonthItem,
        deleteNextMonthItem,
        importFixedToNextMonth,
        resetNextMonthPlan,
        setNextMonthTarget,
        setCalendarDayNote,
        pushToCloud,
        pullFromCloud,
        exportSyncCode,
        importSyncCode,
        resetToDefault,
        wipeToBlankSlate,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
