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
  dec: 11, december: 11,
};

export function normalizeYear(yStr: string | number): number {
  const y = typeof yStr === 'number' ? yStr : parseInt(String(yStr), 10);
  if (isNaN(y)) return 2026;
  if (y < 100) return 2000 + y;
  return y;
}

export function buildDateObj(day: number, monthIdx: number, year: number, rawLine = '') {
  const d = Math.max(1, Math.min(31, day));
  const m = Math.max(0, Math.min(11, monthIdx));
  const y = year || 2026;
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
    recognized: true,
  };
}

export function extractSmsDate(line: string) {
  if (!line) return buildDateObj(26, 9, 2026, '');

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

  // 5. DD-MMM or DD MMM or DD/MMM (without year in SMS alert: default to current/2026)
  const dmAlpha = line.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s\-\/\.,]+([A-Za-z]{3,9})\b/);
  if (dmAlpha) {
    const mKey = dmAlpha[2].toLowerCase();
    if (MONTH_MAP[mKey] !== undefined) {
      return buildDateObj(parseInt(dmAlpha[1], 10), MONTH_MAP[mKey], 2026, line);
    }
  }

  // 6. DD/MM or DD-MM (without year: e.g. 24/10 or 26-10)
  const dmNum = line.match(/\b(\d{1,2})[\-\/\.](\d{1,2})\b/);
  if (dmNum) {
    const p1 = parseInt(dmNum[1], 10);
    const p2 = parseInt(dmNum[2], 10);
    if (p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      return buildDateObj(p1, p2 - 1, 2026, line);
    }
  }

  const fallback = buildDateObj(26, 9, 2026, line);
  fallback.recognized = false;
  return fallback;
}

export function normalizeMerchantName(merchantRaw: string): string {
  const m = (merchantRaw || '').trim().toUpperCase();
  if (
    !m ||
    m === 'AXIS CARD MERCHANT' ||
    m === 'JAPAN MERCHANT' ||
    m === 'JAPAN CONBINI / RETAIL' ||
    m === 'ICICI FOREX MERCHANT' ||
    m === 'REGULAR TRANSACTION'
  ) {
    return 'REGULAR TRANSACTION';
  }

  // Never match 7117 (Axis card ending) as 7-Eleven
  if (!/ATM|WITHDRAW|7117|XX7117/.test(m) && /\b(?:7[\-\s]ELEVEN|SEVEN[\-\s]*ELEVEN|7[\-\s\/]11|SEVEN[\s&]+I|7[\s&]+I)\b/i.test(m)) {
    return '7-ELEVEN';
  }
  if (/\b(?:FAMILY\s*MART|FAMIMA)\b/i.test(m)) {
    return 'FAMILYMART';
  }
  if (/\bLAWSON\b/i.test(m) && !/ATM/.test(m)) {
    return 'LAWSON';
  }
  if (/\b(?:MOBILE\s*SUICA|SUICA)\b/i.test(m)) {
    return 'MOBILE SUICA';
  }
  if (/\bUNIQLO\b/i.test(m)) {
    return 'UNIQLO';
  }
  if (/\b(?:MAX\s*VALU|MAXVALU|COMONOKE|AEON\s*MAXVALU)\b/i.test(m)) {
    return 'MAXVALU COMONOKE';
  }
  if (/\b(?:BIC\s*CAMERA|BICCAMERA)\b/i.test(m)) {
    return 'BIC CAMERA';
  }
  if (/\b(?:YODOBASHI|YODOBASHI\s*CAMERA)\b/i.test(m)) {
    return 'YODOBASHI CAMERA';
  }
  if (/\bNITORI\b/i.test(m)) {
    return 'NITORI';
  }
  if (/\b(?:JR\s*CENTRAL|JR\s*EAST|JR\s*WEST|MEITETSU)\b/i.test(m)) {
    return 'JR / MEITETSU TRANSIT';
  }
  if (/\bSTARBUCKS\b/i.test(m)) {
    return 'STARBUCKS';
  }
  if (/\b(?:MCDONALD'?S|MCDONALDS|MAC)\b/i.test(m)) {
    return "MCDONALD'S";
  }
  if (/\bSWIGGY\b/i.test(m)) {
    return 'SWIGGY';
  }
  if (/\bZOMATO\b/i.test(m)) {
    return 'ZOMATO';
  }
  if (/\bBLINKIT\b/i.test(m)) {
    return 'BLINKIT';
  }
  if (/\bAMAZON\b/i.test(m)) {
    return 'AMAZON';
  }
  if (/\bUBER\b/i.test(m)) {
    return 'UBER';
  }

  // Clean trailing punctuation or reference IDs
  return m.replace(/^AT\s+/i, '').replace(/^TO\s+/i, '').replace(/[\.,;:_\-]+$/, '').trim();
}

export function smartCategorizeExpense(merchantRaw: string, rawLine = ''): string {
  const normM = normalizeMerchantName(merchantRaw);
  // Remove 7117 card number so it doesn't trigger 7-11 regex!
  const text = `${normM} ${merchantRaw || ''} ${rawLine || ''}`.replace(/XX7117|7117/gi, ' ').toUpperCase();

  // 1. Cash Withdrawal / ATM
  if (/WITHDRAW|WDL|ATM|CASH\s*ADV|SEVEN\s*BANK|JP\s*BANK|YUCHO|E-NET|LAWSON\s*BANK\s*ATM|MUFG\s*ATM|SMBC\s*ATM/.test(text)) {
    return 'Cash Withdrawal';
  }

  // 2. Groceries & Supermarket (MaxValu, Comonoke, AEON, Supermarkets, Big, Life, Seiyu)
  if (/\b(?:MAX\s*VALU|MAXVALU|COMONOKE|AEON|LIFE|SEIYU|ITO[\-\s]*YOKADO|SUPERMARKET|GROCERY|VEGETABLE|MEAT|FISH|MARKET)\b/i.test(text)) {
    return 'Groceries & Supermarket';
  }

  // 3. Convenience Store (Strict word boundaries to never match 7117)
  if (/\b(?:7[\-\s]ELEVEN|SEVEN[\-\s]*ELEVEN|7[\-\s\/]11|SEVEN[\s&]+I|7[\s&]+I|FAMILY\s*MART|FAMILYMART|FAMIMA|LAWSON|MINISTOP|DAILY\s*YAMAZAKI|NEWDAYS|CONBINI|COMBINI|SEICO\s*MART)\b/.test(text)) {
    return 'Convenience Store';
  }

  // 4. Travel & Transit
  if (/MOBILE\s*SUICA|SUICA|PASMO|ICOCA|MANACA|TOICA|JR\s|JR\-|SHINKANSEN|MEITETSU|SUBWAY|METRO|LINIMO|AONAMI|KINTETSU|HANKYU|TOBU|ODAKYU|KEIO|SEIBU|BUS|TAXI|UBER(?!\s*EATS)|DIDI|GO\s*TAXI|ANA\b|JAL\b|INDIGO|AIR\s*INDIA|FLIGHT|TRAIN|TRANSIT|TRAVEL/.test(text)) {
    return 'Travel & Transit';
  }

  // 5. Clothing & Apparel
  if (/\bUNIQLO\b|\bGU\b|\bG\.U\.\b|\bZARA\b|H&M|SHIMAMURA|WEGO|ABC[\-\s]*MART|NIKE|ADIDAS|PUMA|ASICS|ONITSUKA|NEW\s*BALANCE|GAP\b|LEVI|ZOZO|CLOTH|APPAREL|FASHION|SHIRT|SHOES/.test(text)) {
    return 'Clothing & Apparel';
  }

  // 6. Furniture & Home
  if (/NITORI|IKEA|FRANCFRANC|CAINZ|DCM|KOHNAN|DAISO|SERIA|CAN\s*DO|CANDO|3COINS|MUJI|FURNITURE|HOME\s*CENTER/.test(text)) {
    return 'Furniture & Home';
  }

  // 7. Electronics & Tech
  if (/BIC\s*CAMERA|YODOBASHI|YAMADA|EDION|NOJIMA|SOFMAP|APPLE|AMAZON|SONY|NINTENDO|AKIHABARA|ELECTRONIC|TECH|CROMA|RELIANCE\s*DIGITAL/.test(text)) {
    return 'Electronics & Tech';
  }

  // 8. Utilities & Telecom
  if (/RAKUTEN\s*MOBILE|SOFTBANK|DOCOMO|\bAU\b|KDDI|POVO|LINEMO|AHAMO|AIRTEL|JIO|ELECTRIC|GAS|WATER|UTILITY|WIFI|BROADBAND/.test(text)) {
    return 'Utilities & Telecom';
  }

  // 9. Healthcare & Pharmacy
  if (/MATSUMOTO\s*KIYOSHI|WELCIA|SUGI\s*DRUG|SUGI\s*PHARMACY|SUNDRUG|TSURUHA|COCOKARA|PHARMACY|DRUGSTORE|CLINIC|HOSPITAL|MEDICAL|APOLLO\s*PHARMACY|NETMEDS|1MG/.test(text)) {
    return 'Healthcare & Pharmacy';
  }

  // 10. Food & Dining (Dining, cafes, food delivery, bakeries)
  if (/STARBUCKS|MCDONALD|KFC|BURGER|PIZZA|DOMINO|SWIGGY|ZOMATO|CAFE|COFFEE|RESTAURANT|DINING|BAKERY|RAMEN|SUSHI|CURRY|BREAD|LUNCH|DINNER|EAT|FOOD/.test(text)) {
    return 'Food & Dining';
  }

  if (normM === 'REGULAR TRANSACTION') {
    return 'Regular Transaction';
  }

  return 'Food & Dining';
}

export function getCategoryBadgeStyle(cat: string): string {
  const c = (cat || '').toLowerCase();
  if (c.includes('grocer') || c.includes('supermarket')) {
    return 'bg-[#E8FF1F]/15 text-[#E8FF1F] border border-[#E8FF1F]/30';
  }
  if (c.includes('convenience') || c.includes('conbini')) {
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  }
  if (c.includes('food') || c.includes('dining')) {
    return 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
  }
  if (c.includes('clothing') || c.includes('apparel') || c.includes('shopping')) {
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  }
  if (c.includes('travel') || c.includes('transit')) {
    return 'bg-teal-500/15 text-teal-300 border border-teal-500/30';
  }
  if (c.includes('withdrawal') || c.includes('cash') || c.includes('atm')) {
    return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
  }
  if (c.includes('furniture') || c.includes('home') || c.includes('living')) {
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  }
  if (c.includes('electronic') || c.includes('tech')) {
    return 'bg-zinc-500/15 text-zinc-300 border border-zinc-500/30';
  }
  return 'bg-[#181a20] text-zinc-300 border border-white/[0.08]';
}

export function parseSingleSmsLine(line: string, seqIndex = 0): StagedSmsItem {
  const isAxis = /axis|7117/i.test(line);
  const cardCode: CardCode = isAxis ? 'AXIS' : 'ICICI';
  const cardUsed = isAxis ? 'Axis Bank XX7117' : 'ICICI Forex XX0817';

  // 1. Balance extraction
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

  // 2. Amount extraction
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

  // 3. Date extraction
  const dateInfo = extractSmsDate(line);

  // 4. Robust Merchant / Source identification
  // Clean card mentions and account details first so they don't get captured as the merchant
  const sanitizedForMerchant = lineWithoutBal
    .replace(/ICICI\s*Bank\s*(?:Forex|Prepaid|Credit|Debit)?\s*Card\s*(?:XX|\*{2,4}|ending)?\s*\d{2,4}/gi, ' ')
    .replace(/Axis\s*Bank\s*(?:Credit|Debit)?\s*Card\s*(?:XX|\*{2,4}|ending)?\s*\d{2,4}/gi, ' ')
    .replace(/Card\s*(?:XX|\*{2,4}|ending\s*with)?\s*\d{2,4}/gi, ' ')
    .replace(/A\/?c\s*(?:XX|\*{2,4}|ending)?\s*\d{2,4}/gi, ' ')
    .replace(/\b(?:XX7117|XX0817|4XXX0817|7117|0817)\b/gi, ' ');

  let merchant = 'REGULAR TRANSACTION';

  // Strategy A: UPI VPA (e.g. VPA swiggy@icici or to merchant@okhdfcbank)
  const upiMatch = sanitizedForMerchant.match(/\b(?:VPA|to)\s+([a-zA-Z0-9\.\-_]+)@[a-zA-Z]+/i);
  if (upiMatch && upiMatch[1]) {
    merchant = upiMatch[1].toUpperCase();
  }

  // Strategy B: "at [MERCHANT]" or "towards [MERCHANT]" or "to [MERCHANT]" or "info: [MERCHANT]"
  if (merchant === 'REGULAR TRANSACTION') {
    const atMatch = sanitizedForMerchant.match(
      /\b(?:at|towards|info:?|merchant:?|paid to)\s+([A-Za-z0-9\-\s&'\.\/]+?)(?=\s+on\b|\s+dated\b|\s+dt\b|\s+ref\b|\s+\d{1,2}[\-\/\.]|\s+avl\b|\s+avail\b|\s+for\b|\.|$|,)/i
    );
    if (atMatch && atMatch[1]) {
      const candidate = atMatch[1].trim().replace(/[\.,;:\-]+$/, '').trim();
      const lower = candidate.toLowerCase();
      if (
        candidate.length >= 2 &&
        !/^(axis|icici|bank|card|forex|credit|debit|inr|jpy|cardholder|customer|your)$/i.test(lower) &&
        !/7117|0817/.test(candidate)
      ) {
        merchant = candidate.toUpperCase();
      }
    }
  }

  // Strategy C: Keyword scanning for known merchants if merchant is still generic
  if (merchant === 'REGULAR TRANSACTION') {
    const textUpper = sanitizedForMerchant.toUpperCase();
    if (/WITHDRAW|WITHDREW|ATM|CASH\s*ADV|WDL/i.test(textUpper)) {
      merchant = 'ATM CASH WITHDRAWAL';
    } else if (/\b(?:7[\-\s]ELEVEN|SEVEN[\-\s]*ELEVEN|7[\-\s\/]11)\b/i.test(textUpper)) {
      merchant = '7-ELEVEN';
    } else if (/FAMILY\s*MART|FAMILYMART|FAMIMA/i.test(textUpper)) {
      merchant = 'FAMILYMART';
    } else if (/LAWSON/i.test(textUpper)) {
      merchant = 'LAWSON';
    } else if (/MOBILE\s*SUICA|SUICA|PASMO|ICOCA/i.test(textUpper)) {
      merchant = 'MOBILE SUICA';
    } else if (/UNIQLO/i.test(textUpper)) {
      merchant = 'UNIQLO';
    } else if (/BIC\s*CAMERA/i.test(textUpper)) {
      merchant = 'BIC CAMERA';
    } else if (/YODOBASHI/i.test(textUpper)) {
      merchant = 'YODOBASHI CAMERA';
    } else if (/NITORI/i.test(textUpper)) {
      merchant = 'NITORI';
    } else if (/STARBUCKS/i.test(textUpper)) {
      merchant = 'STARBUCKS';
    } else if (/SWIGGY/i.test(textUpper)) {
      merchant = 'SWIGGY';
    } else if (/ZOMATO/i.test(textUpper)) {
      merchant = 'ZOMATO';
    } else if (/BLINKIT/i.test(textUpper)) {
      merchant = 'BLINKIT';
    } else if (/AMAZON/i.test(textUpper)) {
      merchant = 'AMAZON';
    } else if (/UBER/i.test(textUpper)) {
      merchant = 'UBER';
    } else if (/JR\s*CENTRAL|MEITETSU/i.test(textUpper)) {
      merchant = 'JR / MEITETSU TRANSIT';
    }
  }

  merchant = normalizeMerchantName(merchant);
  const category = smartCategorizeExpense(merchant, sanitizedForMerchant);

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
    rawLine: line,
  };
}

export function recalculateCardBalances(
  transactions: Transaction[],
  selectedMonth: string,
  currentIcici: CardState,
  currentAxis: CardState
): { icici: CardState; axis: CardState } {
  const monthKey = selectedMonth || 'Oct-2026';
  const monthTxs =
    monthKey === 'ALL' ? transactions : transactions.filter((t) => getTxMonthKey(t) === monthKey);

  // 1. ICICI calculations:
  // If month has transactions, compute month spend; otherwise compute total spend
  const iciciSpentJpy = monthTxs
    .filter((t) => t.cardCode === 'ICICI')
    .reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);

  const iciciTxs = transactions
    .filter((t) => t.cardCode === 'ICICI')
    .slice()
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));

  let newIciciBalance = currentIcici.balanceJpy ?? 0;
  let newIciciLastSync = currentIcici.lastSyncInfo || 'No transactions yet';

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
  } else if (iciciTxs.length > 0) {
    // If balance was set manually and transactions were added without SMS balance
    const totalIciciSpent = iciciTxs.reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
    if ((currentIcici.balanceJpy ?? 0) > 0) {
      newIciciBalance = Math.max(0, (currentIcici.balanceJpy ?? 0) - totalIciciSpent);
    }
    newIciciLastSync = `${iciciTxs[iciciTxs.length - 1].date} (${iciciTxs[iciciTxs.length - 1].merchant.slice(0, 14)})`;
  }

  // 2. Axis calculations:
  const axisSpentInr = monthTxs
    .filter((t) => t.cardCode === 'AXIS')
    .reduce((sum, t) => sum + (Number(t.amountInr) || Math.round((Number(t.amountJpy) || 0) / 1.8)), 0);

  const axisTxs = transactions
    .filter((t) => t.cardCode === 'AXIS')
    .slice()
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));

  let newAxisBalance = currentAxis.balanceInr ?? 0;
  let newAxisLastSync = currentAxis.lastSyncInfo || 'No transactions yet';

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
  } else if (axisTxs.length > 0) {
    const totalAxisSpent = axisTxs.reduce(
      (sum, t) => sum + (Number(t.amountInr) || Math.round((Number(t.amountJpy) || 0) / 1.8)),
      0
    );
    if ((currentAxis.balanceInr ?? 0) > 0) {
      newAxisBalance = Math.max(0, (currentAxis.balanceInr ?? 0) - totalAxisSpent);
    }
    newAxisLastSync = `${axisTxs[axisTxs.length - 1].date} (${axisTxs[axisTxs.length - 1].merchant.slice(0, 14)})`;
  }

  return {
    icici: {
      ...currentIcici,
      balanceJpy: newIciciBalance,
      spentJpy: iciciSpentJpy,
      lastSyncInfo: newIciciLastSync,
    },
    axis: {
      ...currentAxis,
      balanceInr: newAxisBalance,
      spentInr: axisSpentInr,
      lastSyncInfo: newAxisLastSync,
    },
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
