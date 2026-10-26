import { StagedSmsItem, CardCode, Transaction, CardState } from '../types/finance';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export function normalizeYear(yStr: string | number): number {
  const y = typeof yStr === 'number' ? yStr : parseInt(yStr, 10);
  if (y < 100) return 2000 + y;
  return y;
}

export function buildDateObj(day: number, monthIdx: number, year: number, rawLine = '') {
  const d = Math.max(1, Math.min(31, day));
  const m = Math.max(0, Math.min(11, monthIdx));
  const y = year;
  let hours = 12, mins = 0, secs = 0;
  if (rawLine) {
    const timeMatch = rawLine.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?\b/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      mins = parseInt(timeMatch[2], 10);
      secs = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }
  const dt = new Date(y, m, d, hours, mins, secs);
  const dd = String(d).padStart(2, '0');
  const mmm = MONTH_NAMES[m];
  return {
    dateStr: `${dd}-${mmm}-${y}`,
    timestampMs: dt.getTime(),
    dayOfMonth: d,
    monthIdx: m,
    year: y,
    recognized: true
  };
}

export function extractSmsDate(line: string) {
  if (!line) return buildDateObj(24, 9, 2026, '');

  // 1. DD-MMM-YYYY / DD/MMM/YY / DD MMM YYYY / DDth MMM YYYY
  const dmyAlpha = line.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s\-\/\.,]+([A-Za-z]{3,9})[\s\-\/\.,]+(\d{2,4})\b/);
  if (dmyAlpha) {
    const mKey = dmyAlpha[2].toLowerCase();
    if (MONTH_MAP[mKey] !== undefined) {
      return buildDateObj(parseInt(dmyAlpha[1], 10), MONTH_MAP[mKey], normalizeYear(dmyAlpha[3]), line);
    }
  }

  // 2. MMM DD, YYYY / MMM DD YY
  const mdyAlpha = line.match(/\b([A-Za-z]{3,9})[\s\-\.]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s,\-\/]+(\d{2,4}))?\b/);
  if (mdyAlpha) {
    const mKey = mdyAlpha[1].toLowerCase();
    if (MONTH_MAP[mKey] !== undefined) {
      const yr = mdyAlpha[3] ? normalizeYear(mdyAlpha[3]) : 2026;
      return buildDateObj(parseInt(mdyAlpha[2], 10), MONTH_MAP[mKey], yr, line);
    }
  }

  // 3. YYYY-MM-DD or YYYY/MM/DD
  const ymdNum = line.match(/\b(20\d{2})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})\b/);
  if (ymdNum) {
    const yr = parseInt(ymdNum[1], 10);
    const mo = parseInt(ymdNum[2], 10) - 1;
    const da = parseInt(ymdNum[3], 10);
    if (mo >= 0 && mo <= 11 && da >= 1 && da <= 31) {
      return buildDateObj(da, mo, yr, line);
    }
  }

  // 4. DD-MM-YYYY / DD/MM/YYYY / DD-MM-YY / DD/MM/YY / DD.MM.YY
  const dmyNum = line.match(/\b(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{2,4})\b/);
  if (dmyNum) {
    const p1 = parseInt(dmyNum[1], 10);
    const p2 = parseInt(dmyNum[2], 10);
    const yr = normalizeYear(dmyNum[3]);
    let day = p1;
    let monthIdx = p2 - 1;
    if (p2 > 12 && p1 <= 12) {
      monthIdx = p1 - 1;
      day = p2;
    }
    if (monthIdx >= 0 && monthIdx <= 11 && day >= 1 && day <= 31) {
      return buildDateObj(day, monthIdx, yr, line);
    }
  }

  const fallback = buildDateObj(24, 9, 2026, line);
  fallback.recognized = false;
  return fallback;
}

export function normalizeMerchantName(merchantRaw: string): string {
  const m = (merchantRaw || '').trim().toUpperCase();
  if (!m || m === 'AXIS CARD MERCHANT' || m === 'JAPAN MERCHANT' || m === 'JAPAN CONBINI / RETAIL' || m === 'ICICI FOREX MERCHANT') {
    return 'REGULAR TRANSACTION';
  }
  // Normalize all 7-Eleven variations to '7-ELEVEN' (unless it's Seven Bank ATM)
  if (!/ATM|WITHDRAW/.test(m) && (/7[\-\s\/]*ELEVEN|7[\-\s\/]*11|SEVEN[\-\s]*ELEVEN|SEVEN\s*&\s*I|7\s*&\s*I/.test(m))) {
    return '7-ELEVEN';
  }
  if (/FAMILY\s*MART|FAMIMA/.test(m)) {
    return 'FAMILYMART';
  }
  if (/^LAWSON\b/.test(m) && !/ATM/.test(m)) {
    return 'LAWSON';
  }
  return m;
}

export function smartCategorizeExpense(merchantRaw: string, rawLine = ''): string {
  const normM = normalizeMerchantName(merchantRaw);
  const text = `${normM} ${merchantRaw || ''} ${rawLine || ''}`.toUpperCase();

  // 1. Cash Withdrawal / ATM
  if (/WITHDRAW|WDL|ATM|CASH\s*ADV|SEVEN\s*BANK|JP\s*BANK|YUCHO|E-NET|LAWSON\s*BANK\s*ATM|MUFG\s*ATM|SMBC\s*ATM/.test(text)) {
    return 'Cash Withdrawal';
  }

  // 2. Convenience Store (7/11, 7-Eleven, Seven Eleven, Seven & i, FamilyMart, Lawson, Ministop, Daily Yamazaki, NewDays)
  if (/7[\-\s\/]*ELEVEN|7[\-\s\/]*11|SEVEN[\-\s]*ELEVEN|SEVEN\s*&\s*I|7\s*&\s*I|FAMILY\s*MART|FAMILYMART|FAMIMA|LAWSON|MINISTOP|DAILY\s*YAMAZAKI|NEWDAYS|CONBINI|COMBINI|SEICO\s*MART/.test(text)) {
    return 'Convenience Store';
  }

  // 3. Travel & Transit (Mobile Suica, PASMO, ICOCA, Manaca, JR, Meitetsu, Subway, Shinkansen, Uber, Taxi, Airlines)
  if (/MOBILE\s*SUICA|SUICA|PASMO|ICOCA|MANACA|TOICA|JR\s|JR\-|SHINKANSEN|MEITETSU|SUBWAY|METRO|LINIMO|AONAMI|KINTETSU|HANKYU|TOBU|ODAKYU|KEIO|SEIBU|BUS|TAXI|UBER(?!\s*EATS)|DIDI|GO\s*TAXI|ANA\b|JAL\b|INDIGO|AIR\s*INDIA|FLIGHT|TRAIN|TRANSIT|TRAVEL/.test(text)) {
    return 'Travel & Transit';
  }

  // 4. Clothing & Apparel (Uniqlo, GU, Zara, H&M, Muji, Shimamura, ABC-Mart, Nike, Adidas, etc.)
  if (/\bUNIQLO\b|\bGU\b|\bG\.U\.\b|\bZARA\b|H&M|SHIMAMURA|WEGO|ABC[\-\s]*MART|NIKE|ADIDAS|PUMA|ASICS|ONITSUKA|NEW\s*BALANCE|GAP\b|LEVI|ZOZO|CLOTH|APPAREL|FASHION|SHIRT|SHOES/.test(text)) {
    return 'Clothing & Apparel';
  }

  // 5. Furniture & Home (Nitori, IKEA, Francfranc, Daiso, Seria, CanDo, Cainz, Muji)
  if (/NITORI|IKEA|FRANCFRANC|CAINZ|DCM|KOHNAN|DAISO|SERIA|CAN\s*DO|CANDO|3COINS|MUJI|FURNITURE|HOME\s*CENTER/.test(text)) {
    return 'Furniture & Home';
  }

  // 6. Electronics & Tech (Bic Camera, Yodobashi, Yamada Denki, Edion, Apple, Amazon, Sony)
  if (/BIC\s*CAMERA|YODOBASHI|YAMADA|EDION|NOJIMA|SOFMAP|APPLE|AMAZON|SONY|NINTENDO|AKIHABARA|ELECTRONIC|TECH/.test(text)) {
    return 'Electronics & Tech';
  }

  // 7. Utilities & Telecom (Rakuten Mobile, SoftBank, Docomo, au, Povo, Linemo, Electricity, Gas)
  if (/RAKUTEN\s*MOBILE|SOFTBANK|DOCOMO|\bAU\b|KDDI|POVO|LINEMO|AHAMO|AIRTEL|JIO|ELECTRIC|GAS|WATER|UTILITY|WIFI|BROADBAND/.test(text)) {
    return 'Utilities & Telecom';
  }

  // 8. Healthcare & Pharmacy (Matsumoto Kiyoshi, Welcia, Sugi, Sundrug)
  if (/MATSUMOTO\s*KIYOSHI|WELCIA|SUGI\s*DRUG|SUGI\s*PHARMACY|SUNDRUG|TSURUHA|COCOKARA|PHARMACY|DRUGSTORE|CLINIC|HOSPITAL|MEDICAL/.test(text)) {
    return 'Healthcare & Pharmacy';
  }

  // 9. If it's a generic Regular Transaction without a specific food/restaurant keyword, label as 'Regular Transaction'
  if (normM === 'REGULAR TRANSACTION') {
    return 'Regular Transaction';
  }

  // 10. Food & Dining (Restaurants, Cafes, Fast Food, Groceries, Supermarkets, and default dining)
  return 'Food & Dining';
}

export function getCategoryBadgeStyle(cat: string): string {
  const c = (cat || '').toLowerCase();
  if (c.includes('convenience') || c.includes('conbini')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (c.includes('food') || c.includes('dining')) {
    return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
  }
  if (c.includes('clothing') || c.includes('apparel') || c.includes('shopping')) {
    return 'bg-amber-500/15 text-amber-300 border-white/10';
  }
  if (c.includes('travel') || c.includes('transit')) {
    return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  }
  if (c.includes('withdrawal') || c.includes('cash') || c.includes('atm')) {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
  if (c.includes('furniture') || c.includes('home') || c.includes('living')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  if (c.includes('electronic') || c.includes('tech')) {
    return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
  return 'bg-[#181a20] text-zinc-300 border-white/[0.08]';
}

export function parseSingleSmsLine(line: string, seqIndex = 0): StagedSmsItem {
  const isAxis = /axis|7117/i.test(line);
  const cardCode: CardCode = isAxis ? 'AXIS' : 'ICICI';
  const cardUsed = isAxis ? 'Axis Bank XX7117' : 'ICICI Forex XX0817';

  let smsBalanceRaw: number | null = null;
  let smsBalanceCurrency: 'INR' | 'JPY' = isAxis ? 'INR' : 'JPY';
  const balRegex = /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?|Avbl\.?\s*Bal(?:ance)?|Avl\.?\s*Lmt|Avl\.?\s*Limit|Available\s*Limit|Curr(?:ent)?\s*Bal(?:ance)?|Rem(?:aining)?\s*Bal(?:ance)?|\bBal(?:ance)?)\s*(?:is|:|-)?\s*(?:(JPY|INR|USD|Rs\.?|¥|₹|\$)\s*)?([\d,]+(?:\.\d{1,2})?)/i;
  const balMatch = line.match(balRegex);
  if (balMatch && balMatch[2]) {
    const parsedBal = Math.round(parseFloat(balMatch[2].replace(/,/g, '')));
    if (!isNaN(parsedBal)) {
      smsBalanceRaw = parsedBal;
      const sym = (balMatch[1] || '').toUpperCase();
      if (sym.includes('INR') || sym.includes('RS') || sym.includes('₹')) {
        smsBalanceCurrency = 'INR';
      } else if (sym.includes('JPY') || sym.includes('¥')) {
        smsBalanceCurrency = 'JPY';
      }
    }
  }

  const lineWithoutBal = balMatch ? line.replace(balMatch[0], ' ') : line;

  let amountJpy = 1500;
  let amountInr = Math.round(1500 / 1.8);
  let nativeCurrency: 'JPY' | 'INR' = isAxis ? 'INR' : 'JPY';

  const jpySpend = lineWithoutBal.match(/(?:JPY|¥)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:JPY|¥)/i);
  const inrSpend = lineWithoutBal.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹)/i);
  const genericSpend = lineWithoutBal.match(/(?:spent|debited|used|charged|for|of|amt)\s*(?:for|of|by)?\s*([\d,]+(?:\.\d{1,2})?)/i);

  if (jpySpend) {
    const numStr = jpySpend[1] || jpySpend[2];
    amountJpy = Math.round(parseFloat(numStr.replace(/,/g, ''))) || 1500;
    amountInr = Math.round(amountJpy / 1.8);
    nativeCurrency = 'JPY';
  } else if (inrSpend) {
    const numStr = inrSpend[1] || inrSpend[2];
    amountInr = Math.round(parseFloat(numStr.replace(/,/g, ''))) || 1000;
    amountJpy = Math.round(amountInr * 1.8);
    nativeCurrency = 'INR';
  } else if (genericSpend) {
    const val = Math.round(parseFloat(genericSpend[1].replace(/,/g, ''))) || 1200;
    if (isAxis) {
      amountInr = val;
      amountJpy = Math.round(val * 1.8);
      nativeCurrency = 'INR';
    } else {
      amountJpy = val;
      amountInr = Math.round(val / 1.8);
      nativeCurrency = 'JPY';
    }
  }

  const dateInfo = extractSmsDate(line);

  let merchant = 'REGULAR TRANSACTION';
  const atMatch = lineWithoutBal.match(/\b(?:at|to|in|towards|from|info:?|merchant:?)\s+([A-Za-z0-9\-\s&'\.\/]+?)(?=\s+on\b|\s+dated\b|\s+dt\b|\s+ref\b|\s+\d{1,2}[\-\/\.]|\s+avl\b|\.|$)/i);
  if (atMatch && atMatch[1]) {
    const candidate = atMatch[1].trim().replace(/[\.,;:\-]+$/, '').trim();
    if (candidate.length >= 2 && !/^(axis|icici|bank|card|forex|credit|debit|inr|jpy)$/i.test(candidate)) {
      merchant = candidate.toUpperCase();
    }
  }
  if (merchant === 'REGULAR TRANSACTION') {
    if (/withdraw|withdrew|atm|cash\s*adv|wdl/i.test(lineWithoutBal)) {
      merchant = 'ATM CASH WITHDRAWAL';
    } else if (/7[\-\s\/]*eleven|7[\-\s\/]*11|seven[\-\s]*eleven/i.test(lineWithoutBal)) {
      merchant = '7-ELEVEN';
    } else if (/family\s*mart|familymart/i.test(lineWithoutBal)) {
      merchant = 'FAMILYMART';
    } else if (/lawson/i.test(lineWithoutBal)) {
      merchant = 'LAWSON';
    } else if (/suica|pasmo|icoca|manaca/i.test(lineWithoutBal)) {
      merchant = 'MOBILE SUICA';
    } else if (/uniqlo/i.test(lineWithoutBal)) {
      merchant = 'UNIQLO';
    }
  }
  merchant = normalizeMerchantName(merchant);

  const category = smartCategorizeExpense(merchant, lineWithoutBal);

  let normalizedCardBalance: number | null = null;
  if (smsBalanceRaw !== null) {
    if (cardCode === 'ICICI') {
      normalizedCardBalance = smsBalanceCurrency === 'INR' ? Math.round(smsBalanceRaw * 1.8) : smsBalanceRaw;
    } else {
      normalizedCardBalance = smsBalanceCurrency === 'JPY' ? Math.round(smsBalanceRaw / 1.8) : smsBalanceRaw;
    }
  }

  return {
    merchant,
    cardCode,
    cardUsed,
    category,
    spender: isAxis && !/son|japan|tokyo|nisshin|bic|7-eleven|lawson|familymart/i.test(line) ? 'Dad' : 'Son',
    date: dateInfo.dateStr,
    dateRecognized: dateInfo.recognized,
    timestampMs: dateInfo.timestampMs + seqIndex,
    amountJpy,
    amountInr,
    nativeCurrency,
    smsBalance: normalizedCardBalance,
    rawLine: line
  };
}

export function recalculateCardBalances(
  transactions: Transaction[],
  selectedMonth: string,
  currentIcici: CardState,
  currentAxis: CardState
): { icici: CardState; axis: CardState } {
  const monthKey = selectedMonth || 'Oct-2026';
  const monthTxs = monthKey === 'ALL'
    ? transactions
    : transactions.filter(t => getTxMonthKey(t) === monthKey);

  // 1. ICICI calculations
  const iciciSpentJpy = monthTxs
    .filter(t => t.cardCode === 'ICICI')
    .reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);

  const iciciTxs = transactions
    .filter(t => t.cardCode === 'ICICI')
    .slice()
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));

  let newIciciBalance = currentIcici.balanceJpy ?? 63756;
  let newIciciLastSync = currentIcici.lastSyncInfo;

  let latestIciciIdx = -1;
  for (let i = iciciTxs.length - 1; i >= 0; i--) {
    if (iciciTxs[i].smsBalance !== null && iciciTxs[i].smsBalance !== undefined) {
      latestIciciIdx = i;
      break;
    }
  }

  if (latestIciciIdx !== -1) {
    const anchor = iciciTxs[latestIciciIdx];
    let runningBal = Number(anchor.smsBalance);
    for (let j = latestIciciIdx + 1; j < iciciTxs.length; j++) {
      runningBal = Math.max(0, runningBal - (Number(iciciTxs[j].amountJpy) || 0));
    }
    newIciciBalance = runningBal;
    newIciciLastSync = `${anchor.date} (${anchor.merchant.slice(0, 14)})`;
  }

  // 2. Axis calculations
  const axisSpentInr = monthTxs
    .filter(t => t.cardCode === 'AXIS')
    .reduce((sum, t) => sum + (Number(t.amountInr) || Math.round((Number(t.amountJpy) || 0) / 1.8)), 0);

  const axisTxs = transactions
    .filter(t => t.cardCode === 'AXIS')
    .slice()
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));

  let newAxisBalance = currentAxis.balanceInr ?? 140000;
  let newAxisLastSync = currentAxis.lastSyncInfo;

  let latestAxisIdx = -1;
  for (let i = axisTxs.length - 1; i >= 0; i--) {
    if (axisTxs[i].smsBalance !== null && axisTxs[i].smsBalance !== undefined) {
      latestAxisIdx = i;
      break;
    }
  }

  if (latestAxisIdx !== -1) {
    const anchor = axisTxs[latestAxisIdx];
    let runningBalInr = Number(anchor.smsBalance);
    for (let j = latestAxisIdx + 1; j < axisTxs.length; j++) {
      const deductInr = Number(axisTxs[j].amountInr) || Math.round((Number(axisTxs[j].amountJpy) || 0) / 1.8);
      runningBalInr = Math.max(0, runningBalInr - deductInr);
    }
    newAxisBalance = runningBalInr;
    newAxisLastSync = `${anchor.date} (${anchor.merchant.slice(0, 14)})`;
  }

  return {
    icici: {
      ...currentIcici,
      balanceJpy: newIciciBalance,
      spentJpy: iciciSpentJpy,
      lastSyncInfo: newIciciLastSync
    },
    axis: {
      ...currentAxis,
      balanceInr: newAxisBalance,
      spentInr: axisSpentInr,
      lastSyncInfo: newAxisLastSync
    }
  };
}

export function getTxMonthKey(tx: Transaction): string {
  if (!tx || !tx.date) return 'Oct-2026';
  const m = tx.date.match(/\b([A-Za-z]{3})\-(\d{4})\b/);
  if (m) {
    const mon = m[1].charAt(0).toUpperCase() + m[1].slice(1, 3).toLowerCase();
    return `${mon}-${m[2]}`;
  }
  const dInfo = extractSmsDate(tx.date);
  return `${MONTH_NAMES[dInfo.monthIdx]}-${dInfo.year}`;
}
