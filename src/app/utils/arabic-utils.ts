/**
 * Arabic & Bilingual normalization and formatting utility helpers
 */

export function isEnglishText(str: string): boolean {
  if (!str) return false;
  return /[a-zA-Z]/.test(str);
}

export const ENGLISH_ARABIC_NAME_DICT: Record<string, string> = {
  // Common first & family names
  'ahmed': 'احمد',
  'ahmad': 'احمد',
  'mohamed': 'محمد',
  'mohammed': 'محمد',
  'muhammad': 'محمد',
  'muhammed': 'محمد',
  'mohamad': 'محمد',
  'mahmoud': 'محمود',
  'mahmood': 'محمود',
  'mostafa': 'مصطفي',
  'moustafa': 'مصطفي',
  'mustafa': 'مصطفي',
  'khaled': 'خالد',
  'khalid': 'خالد',
  'sara': 'ساره',
  'sarah': 'ساره',
  'fatma': 'فاطمه',
  'fatima': 'فاطمه',
  'fatema': 'فاطمه',
  'ali': 'علي',
  'aly': 'علي',
  'omar': 'عمر',
  'amr': 'عمرو',
  'hossam': 'حسام',
  'hussam': 'حسام',
  'adel': 'عادل',
  'aadel': 'عادل',
  'nour': 'نور',
  'noor': 'نور',
  'nourhan': 'نورهان',
  'noorhan': 'نورهان',
  'mariam': 'مريم',
  'maryam': 'مريم',
  'meryem': 'مريم',
  'menna': 'منه',
  'aya': 'ايه',
  'ayah': 'ايه',
  'mona': 'مني',
  'nada': 'ندي',
  'heitham': 'هيثم',
  'haitham': 'هيثم',
  'hassan': 'حسن',
  'hasan': 'حسن',
  'hussein': 'حسين',
  'hussain': 'حسين',
  'youssef': 'يوسف',
  'yousef': 'يوسف',
  'ibrahim': 'ابراهيم',
  'ebrahim': 'ابراهيم',
  'ismail': 'اسماعيل',
  'esmail': 'اسماعيل',
  'tarek': 'طارق',
  'tarik': 'طارق',
  'karim': 'كريم',
  'kareem': 'كريم',
  'amira': 'اميره',
  'ameera': 'اميره',
  'eman': 'ايمان',
  'iman': 'ايمان',
  'asmaa': 'اسماء',
  'asma': 'اسماء',
  'reham': 'ريهام',
  'riham': 'ريهام',
  'salma': 'سلمي',
  'shahd': 'شهد',
  'yasmine': 'ياسمين',
  'yasmin': 'ياسمين',
  'ranim': 'رنيم',
  'raneem': 'رنيم',
  'dina': 'دينا',
  'deena': 'دينا',
  'samar': 'سمر',
  'sahar': 'سحر',
  'shaimaa': 'شيماء',
  'shaymaa': 'شيماء',
  'mai': 'مي',
  'may': 'مي',
  'hager': 'هاجر',
  'hajar': 'هاجر',
  'hend': 'هند',
  'radwa': 'رضوي',
  'reem': 'ريم',
  'rawan': 'روان',
  'gehan': 'جيهان',
  'jehan': 'جيهان',
  'nesma': 'نسمه',
  'nesreen': 'نسرين',
  'nisreen': 'نسرين',
  'wael': 'وائل',
  'tamer': 'تامر',
  'ramy': 'رامي',
  'rami': 'رامي',
  'fady': 'فادي',
  'fadi': 'فادي',
  'mina': 'مينا',
  'kamal': 'كمال',
  'ashraf': 'اشرف',
  'gamal': 'جمال',
  'jamal': 'جمال',
  'bassem': 'باسم',
  'basim': 'باسم',
  'walid': 'وليد',
  'waleed': 'وليد',
  'ziad': 'زياد',
  'zeyad': 'زياد',
  'eyad': 'اياد',
  'iyad': 'اياد',
  'sayed': 'سيد',
  'saeed': 'سعيد',
  'saad': 'سعد',
  'nasser': 'ناصر',
  'nabil': 'نبيل',
  'magdy': 'مجدي',
  'medhat': 'مدحت',
  'osama': 'اسامه',
  'ousama': 'اسامه',
  'hany': 'هاني',
  'hani': 'هاني',
  'sherif': 'شريف',
  'shereen': 'شيرين',
  'shireen': 'شيرين',
  'alaa': 'علاء',
  'ola': 'علا',
  'donia': 'دنيا',
  'dunya': 'دنيا',
  'habiba': 'حبيبه',
  'malak': 'ملك',
  'jana': 'جني',
  'roaa': 'رؤي',
  'farah': 'فرح',
  'layla': 'ليلي',
  'laila': 'ليلي',
  'soha': 'سهي',
  'noha': 'نهي',
  'sally': 'سالي',
  'shrouk': 'شروق',
  'shorouk': 'شروق',
  'bassant': 'بسنت',
  'passant': 'بسنت',
  'shaza': 'شذي',
  'naglaa': 'نجلاء',
  'ghada': 'غاده',
  'wafa': 'وفاء',
  'wafaa': 'وفاء',
  'samira': 'سميره',
  'sameera': 'سميره',
  'nawal': 'نوال',
  'sana': 'سناء',
  'sanaa': 'سناء',
  'abdelrahman': 'عبدالرحمن',
  'abdel-rahman': 'عبدالرحمن',
  'abdulrahman': 'عبدالرحمن',
  'abdelrahim': 'عبدالرحيم',
  'abdelsattar': 'عبدالستار',
  'abdel-sattar': 'عبدالستار',
  'abdulsattar': 'عبدالستار',
  'abdelsalam': 'عبدالسلام',
  'abdel-salam': 'عبدالسلام',
  'abdallah': 'عبدالله',
  'abdullah': 'عبدالله',
  'abdelaziz': 'عبدالعزيز',
  'abdel-aziz': 'عبدالعزيز',
  'abdelkader': 'عبدالقادر',
  'abdel-kader': 'عبدالقادر',
  'abdelazim': 'عبدالعظيم',
  'abdel-azim': 'عبدالعظيم',
  'abdelhamid': 'عبدالحميد',
  'abdel-hamid': 'عبدالحميد',
  'abdelghany': 'عبدالغني',
  'abdel-ghany': 'عبدالغني',
  'abdelbaset': 'عبدالباسط',
  'abdel-baset': 'عبدالباسط',
  'abdelwahed': 'عبدالواحد',
  'abdel-wahed': 'عبدالواحد',
  'abdelhakim': 'عبدالحكيم',
  'abdel-hakim': 'عبدالحكيم',
  'abdelnasser': 'عبدالناصر',
  'abdel-nasser': 'عبدالناصر'
};

export function transliterateEnglishWordPhonetic(rawWord: string): string {
  let w = rawWord.toLowerCase().trim();
  if (!w) return '';

  // 1. Direct dictionary match
  if (ENGLISH_ARABIC_NAME_DICT[w]) {
    return ENGLISH_ARABIC_NAME_DICT[w];
  }

  // 2. Handle prefix "abdel", "abdul", "abd"
  if (w.startsWith('abdel') || w.startsWith('abdul')) {
    const rest = w.replace(/^(abdel|abdul)/, '');
    const arabicRest = transliterateEnglishWordPhonetic(rest);
    return 'عبد' + (arabicRest.startsWith('ال') ? arabicRest : 'ال' + arabicRest);
  }
  if (w.startsWith('abd') && !w.startsWith('abde') && w.length > 5) {
    const rest = w.replace(/^abd/, '');
    const arabicRest = transliterateEnglishWordPhonetic(rest);
    return 'عبد' + (arabicRest.startsWith('ال') ? arabicRest : 'ال' + arabicRest);
  }

  // 3. Phonetic Digraphs & Arabizi Franco replacements
  w = w
    .replace(/3/g, 'ع')
    .replace(/7/g, 'ح')
    .replace(/5/g, 'خ')
    .replace(/6/g, 'ط')
    .replace(/8/g, 'غ')
    .replace(/9/g, 'ص')
    .replace(/2/g, 'ا')
    .replace(/kh/g, 'خ')
    .replace(/gh/g, 'غ')
    .replace(/sh/g, 'ش')
    .replace(/ch/g, 'تش')
    .replace(/th/g, 'ث')
    .replace(/ph/g, 'ف')
    .replace(/dh/g, 'ض')
    .replace(/zh/g, 'ظ')
    .replace(/ee|ei|ai|ay|ey/g, 'ي')
    .replace(/oo|ou/g, 'و')
    .replace(/aa/g, 'ا');

  // Single letter mapping
  const charMap: Record<string, string> = {
    'a': 'ا', 'b': 'ب', 'c': 'ك', 'd': 'د', 'e': 'ي',
    'f': 'ف', 'g': 'ج', 'h': 'ه', 'i': 'ي', 'j': 'ج',
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و',
    'p': 'ب', 'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت',
    'u': 'و', 'v': 'ف', 'w': 'و', 'x': 'كس', 'y': 'ي', 'z': 'ز'
  };

  let res = '';
  for (let i = 0; i < w.length; i++) {
    const char = w[i];
    if (charMap[char]) {
      res += charMap[char];
    } else {
      res += char;
    }
  }

  // Collapse consecutive identical Arabic letters from double consonants
  res = res.replace(/(.)\1+/g, '$1');
  return res;
}

export function transliterateEnglishToArabic(str: string): string {
  if (!str) return '';

  // Clean English honorifics (Dr., Doctor, Eng., Mr., Mrs., Ms.)
  let cleaned = str
    .toLowerCase()
    .replace(/\b(dr\.|dr|doctor|eng\.|eng|engineer|mr\.|mr|mrs\.|mrs|ms\.|ms|specialist)\b/gi, ' ')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize compound "abdel sattar" -> "abdelsattar"
  cleaned = cleaned.replace(/\b(abdel|abdul|abd)\s+/g, '$1');

  const words = cleaned.split(/\s+/).filter(Boolean);
  const transliteratedWords = words.map(w => {
    if (isEnglishText(w)) {
      return transliterateEnglishWordPhonetic(w);
    }
    return normalizeArabicText(w);
  });

  return normalizeArabicText(transliteratedWords.join(' '));
}

export function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    // Strip Arabic diacritics (tashkeel): Fat-ha, Kasra, Damma, Sukun, Tanween, Shadda, Dagger Alif
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Strip Tatweel (Kashida)
    .replace(/\u0640/g, '')
    // Normalize Alif variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbouta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alif Maqsoora (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Hamza forms (ئ -> ي, ؤ -> و)
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    // Normalize compound "عبد " to "عبد" (e.g. عبد الستار -> عبدالستار, عبد الله -> عبدالله)
    .replace(/(^|\s)عبد\s+/g, '$1عبد')
    // Normalize compound "ابو " to "ابو"
    .replace(/(^|\s)ابو\s+/g, '$1ابو')
    // Collapse multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Strips common Arabic honorific prefixes like د. / دكتور / أ. / أستاذ / أخصائي
 * to allow natural matching whether the admin included the title or not.
 */
export function stripHonorifics(str: string): string {
  if (!str) return '';
  return normalizeArabicText(str)
    .replace(/^(دكتور|دكتوره|د\.|د|استاذ|استاذه|أستاذ|أستاذة|ا\.|أ\.|اخصائي|اخصائيه|أخصائي|أخصائية)\s+/g, '')
    .trim();
}

export function areArabicNamesEqual(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;

  const n1 = isEnglishText(name1) ? transliterateEnglishToArabic(name1) : normalizeArabicText(name1);
  const n2 = isEnglishText(name2) ? transliterateEnglishToArabic(name2) : normalizeArabicText(name2);

  if (n1 === n2) return true;

  // Try comparing without honorific prefixes
  const s1 = stripHonorifics(n1);
  const s2 = stripHonorifics(n2);
  return s1.length >= 2 && s2.length >= 2 && s1 === s2;
}

export function doesArabicNameMatch(input: string, target: string): boolean {
  if (!input || !target) return false;

  const normInput = isEnglishText(input) ? transliterateEnglishToArabic(input) : normalizeArabicText(input);
  const normTarget = isEnglishText(target) ? transliterateEnglishToArabic(target) : normalizeArabicText(target);

  if (normInput.length < 2) return false;

  if (normTarget.includes(normInput) || normInput.includes(normTarget)) {
    return true;
  }

  // Strip honorifics and test again
  const cleanInput = stripHonorifics(normInput);
  const cleanTarget = stripHonorifics(normTarget);
  if (cleanInput.length < 2) return false;

  return cleanTarget.includes(cleanInput) || cleanInput.includes(cleanTarget);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDateKey(new Date());
}

export function getArabicDayName(date: Date = new Date()): string {
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return arabicDays[date.getDay()];
}

export function formatArabicDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const dayName = arabicDays[date.getDay()];
    const monthName = arabicMonths[date.getMonth()];

    return `${dayName}، ${day} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  return `${rounded.toLocaleString('ar-EG')} ج.م`;
}

/**
 * Calculates duration in minutes from start and end time strings formatted as "HH:mm"
 */
export function calculateDurationMinutes(startTime?: string | null, endTime?: string | null): number | undefined {
  if (!startTime || !endTime) return undefined;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return undefined;

  let startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }
  const diff = endTotal - startTotal;
  return diff > 0 ? diff : undefined;
}

/**
 * Formats a 24-hour "HH:mm" time string to Arabic 12-hour format e.g. "10:30 ص" or "02:15 م"
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const period = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mStr = String(m).padStart(2, '0');
  return `${h12}:${mStr} ${period}`;
}

/**
 * Formats full session timing text with start/end times and duration in Arabic
 * e.g. "10:00 ص - 10:45 ص (45 دقيقة)"
 */
export function formatSessionTiming(startTime?: string | null, endTime?: string | null, duration?: number | null): string {
  const formattedStart = formatTime12Hour(startTime);
  const formattedEnd = formatTime12Hour(endTime);
  const calcDur = (duration !== null && duration !== undefined) ? duration : calculateDurationMinutes(startTime, endTime);

  if (formattedStart && formattedEnd) {
    return calcDur ? `${formattedStart} - ${formattedEnd} (${calcDur} دقيقة)` : `${formattedStart} - ${formattedEnd}`;
  } else if (formattedStart) {
    return calcDur ? `بدء: ${formattedStart} (${calcDur} دقيقة)` : `بدء: ${formattedStart}`;
  } else if (calcDur) {
    return `${calcDur} دقيقة`;
  }
  return '';
}

/**
 * Extracts Arabic day name from date string 'YYYY-MM-DD'
 */
export function getDayNameFromDateKey(dateKey: string): string {
  if (!dateKey) return '';
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    return getArabicDayName(new Date(y, m - 1, d));
  } catch {
    return '';
  }
}
