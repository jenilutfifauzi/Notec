import type { Category } from '../db/schema';
import { MAX_AMOUNT, MAX_NOTE_LENGTH } from './constants';

export type VoiceTransactionParseResult =
  | {
      ok: true;
      value: {
        type: 'income' | 'expense';
        amount: number;
        category: Category;
        note: string;
        dateStr: string;
      };
    }
  | { ok: false; error: string };

const SEEDED_ALIASES: Record<string, string[]> = {
  makan: [
    'makan',
    'makanan',
    'minum',
    'minuman',
    'kopi',
    'sarapan',
    'makan siang',
    'makan malam',
    'restoran',
    'warung',
  ],
  belanja: ['belanja', 'belanjaan', 'shopping'],
  transportasi: [
    'transportasi',
    'transport',
    'bensin',
    'pertalite',
    'pertamax',
    'ojek',
    'taksi',
    'taxi',
    'bus',
    'kereta',
    'parkir',
  ],
  tagihan: ['tagihan', 'listrik', 'air', 'pulsa', 'internet', 'wifi', 'sewa'],
  gaji: ['gaji', 'upah', 'salary'],
  hadiah: ['hadiah', 'bonus', 'thr'],
  lainnya: ['lain', 'lainnya'],
};

const INCOME_CUES = [
  'pemasukan',
  'pendapatan',
  'gaji',
  'bonus',
  'hadiah',
  'terima',
  'menerima',
  'masuk',
] as const;

const EXPENSE_CUES = [
  'pengeluaran',
  'belanja',
  'beli',
  'membeli',
  'bayar',
  'membayar',
  'biaya',
  'keluar',
] as const;

const WORD_UNITS: Record<string, number> = {
  nol: 0,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
};

const NUMBER_WORDS: Record<string, true> = {
  nol: true,
  satu: true,
  dua: true,
  tiga: true,
  empat: true,
  lima: true,
  enam: true,
  tujuh: true,
  delapan: true,
  sembilan: true,
  sepuluh: true,
  sebelas: true,
  seratus: true,
  seribu: true,
  sejuta: true,
  semiliar: true,
  semilyar: true,
  belas: true,
  puluh: true,
  ratus: true,
  ribu: true,
  juta: true,
  miliar: true,
  milyar: true,
  setengah: true,
  koma: true,
  rp: true,
  rupiah: true,
};

const SCALE_WORDS: Record<string, true> = {
  ribu: true,
  juta: true,
  miliar: true,
  milyar: true,
  seribu: true,
  sejuta: true,
  semiliar: true,
  semilyar: true,
};

function normalizeForParsing(text: string): string {
  let s = text.toLowerCase().trim();
  s = s.replace(/,-\b/g, '');
  s = s.replace(/[-_/]/g, ' ');
  // Replace dots and commas not between digits
  s = s.replace(/(?<!\d)[.,]|[.,](?!\d)/g, ' ');
  // Strip non-alphanumeric except dots, commas, spaces
  s = s.replace(/[^a-z0-9.,\s]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function parseSubThousand(tokens: string[]): number {
  let total = 0;
  let current = 0;
  let hasDecimal = false;
  let decimalDivisor = 1;

  for (const t of tokens) {
    if (t === 'koma') {
      hasDecimal = true;
      continue;
    }

    let val: number | null = null;
    if (WORD_UNITS[t] !== undefined) {
      val = WORD_UNITS[t];
    } else if (/^\d+$/.test(t)) {
      val = parseInt(t, 10);
    } else if (t === 'sepuluh') {
      val = 10;
    } else if (t === 'sebelas') {
      val = 11;
    } else if (t === 'seratus') {
      total += 100;
      continue;
    } else if (t === 'setengah') {
      current += 0.5;
      continue;
    }

    if (hasDecimal && val !== null) {
      decimalDivisor *= 10;
      current += val / decimalDivisor;
      continue;
    }

    if (val !== null) {
      if (val >= 10) {
        current = val;
      } else {
        current = current * 10 + val;
      }
    } else if (t === 'belas') {
      current = (current === 0 ? 1 : current) + 10;
      total += current;
      current = 0;
    } else if (t === 'puluh') {
      current = (current === 0 ? 1 : current) * 10;
      total += current;
      current = 0;
    } else if (t === 'ratus') {
      current = (current === 0 ? 1 : current) * 100;
      total += current;
      current = 0;
    }
  }

  return total + current;
}

function parseWordNumber(phrase: string): number | null {
  const rawTokens = phrase
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0 && t !== 'rp' && t !== 'rupiah');
  if (rawTokens.length === 0) return null;

  let total = 0;
  let remaining = rawTokens;

  const scales = [
    {
      names: ['miliar', 'milyar'],
      multiplier: 1_000_000_000,
      se: ['semiliar', 'semilyar'],
    },
    { names: ['juta'], multiplier: 1_000_000, se: ['sejuta'] },
    { names: ['ribu'], multiplier: 1_000, se: ['seribu'] },
  ];

  for (const scale of scales) {
    const seIdx = remaining.findIndex((t) => scale.se.includes(t));
    if (seIdx !== -1) {
      total += 1 * scale.multiplier;
      remaining = [...remaining.slice(0, seIdx), ...remaining.slice(seIdx + 1)];
    }

    const scaleIdx = remaining.findIndex((t) => scale.names.includes(t));
    if (scaleIdx !== -1) {
      const before = remaining.slice(0, scaleIdx);
      const after = remaining.slice(scaleIdx + 1);
      const subVal = before.length === 0 ? 1 : parseSubThousand(before);
      total += subVal * scale.multiplier;
      remaining = after;
    }
  }

  if (remaining.length > 0) {
    total += parseSubThousand(remaining);
  }

  return Math.round(total);
}

interface NumberCandidate {
  start: number;
  end: number;
  raw: string;
  value: number;
  hasMarker: boolean;
}

function extractNumberCandidates(normalizedText: string): NumberCandidate[] {
  const matchedSpans: NumberCandidate[] = [];

  const digitRegex =
    /\b(?:rp\s*)?(\d+(?:[.,]\d+)*)(?:(k|rb|jt)\b|\s+(ribu|rb|k|juta|jt|miliar|milyar)\b)?(?:\s*rupiah)?\b/g;
  let match: RegExpExecArray | null;
  while ((match = digitRegex.exec(normalizedText)) !== null) {
    const fullMatch = match[0].trim();
    if (!fullMatch || !/\d/.test(fullMatch)) continue;

    const numStr = match[1];
    const suffix = (match[2] || match[3] || '').toLowerCase();
    const hasRp = /\brp\b|\brupiah\b/.test(fullMatch);
    let hasMarker = hasRp || !!suffix;
    let value = 0;

    if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu') {
      const cleanNum = numStr.replace(/\./g, '').replace(',', '.');
      value = parseFloat(cleanNum) * 1_000;
      hasMarker = true;
    } else if (suffix === 'jt' || suffix === 'juta') {
      const cleanNum = numStr.replace(/\./g, '').replace(',', '.');
      value = parseFloat(cleanNum) * 1_000_000;
      hasMarker = true;
    } else if (suffix === 'miliar' || suffix === 'milyar') {
      const cleanNum = numStr.replace(/\./g, '').replace(',', '.');
      value = parseFloat(cleanNum) * 1_000_000_000;
      hasMarker = true;
    } else {
      if (/^\d{1,3}(?:\.\d{3})+$/.test(numStr)) {
        value = parseInt(numStr.replace(/\./g, ''), 10);
        hasMarker = true;
      } else if (/^\d{1,3}(?:,\d{3})+$/.test(numStr)) {
        value = parseInt(numStr.replace(/,/g, ''), 10);
        hasMarker = true;
      } else {
        const cleanNum = numStr.replace(',', '.');
        value = parseFloat(cleanNum);
      }
    }

    matchedSpans.push({
      start: match.index,
      end: match.index + match[0].length,
      raw: fullMatch,
      value: Math.round(value),
      hasMarker,
    });
  }

  // Word numbers
  const tokenIndices: { word: string; start: number; end: number }[] = [];
  const tokenRegex = /\S+/g;
  let tm: RegExpExecArray | null;
  while ((tm = tokenRegex.exec(normalizedText)) !== null) {
    tokenIndices.push({
      word: tm[0],
      start: tm.index,
      end: tm.index + tm[0].length,
    });
  }

  let i = 0;
  while (i < tokenIndices.length) {
    if (NUMBER_WORDS[tokenIndices[i].word]) {
      let j = i;
      while (
        j < tokenIndices.length &&
        NUMBER_WORDS[tokenIndices[j].word]
      ) {
        j++;
      }
      const seqTokens = tokenIndices.slice(i, j);
      const contentTokens = seqTokens.filter(
        (t) => t.word !== 'rp' && t.word !== 'rupiah'
      );
      if (contentTokens.length > 0) {
        const spanStart = seqTokens[0].start;
        const spanEnd = seqTokens[seqTokens.length - 1].end;
        const overlaps = matchedSpans.some(
          (ds) => spanStart < ds.end && spanEnd > ds.start
        );
        if (!overlaps) {
          const phrase = seqTokens.map((t) => t.word).join(' ');
          const val = parseWordNumber(phrase);
          if (val !== null && !isNaN(val)) {
            const hasMarker = seqTokens.some(
              (t) =>
                SCALE_WORDS[t.word] || t.word === 'rp' || t.word === 'rupiah'
            );
            matchedSpans.push({
              start: spanStart,
              end: spanEnd,
              raw: phrase,
              value: val,
              hasMarker,
            });
          }
        }
      }
      i = j;
    } else {
      i++;
    }
  }

  return matchedSpans;
}

interface CategoryMatch {
  category: Category;
  matchedPhrase: string;
  isExactName: boolean;
  phraseLength: number;
  start: number;
  end: number;
}

function pruneSubsumedMatches(matches: CategoryMatch[]): CategoryMatch[] {
  const sorted = [...matches].sort((a, b) => b.phraseLength - a.phraseLength);
  const kept: CategoryMatch[] = [];

  for (const m of sorted) {
    const isContained = kept.some(
      (k) =>
        k.start <= m.start &&
        k.end >= m.end &&
        k.end - k.start > m.end - m.start
    );
    if (!isContained) {
      kept.push(m);
    }
  }

  return kept;
}

function pickBestCategory(
  matches: CategoryMatch[]
): { ok: true; category: Category } | { ok: false; error: string } {
  const pruned = pruneSubsumedMatches(matches);

  const catMap = new Map<
    number,
    {
      category: Category;
      isExactName: boolean;
      maxPhraseLength: number;
      matches: CategoryMatch[];
    }
  >();

  for (const m of pruned) {
    if (!catMap.has(m.category.id)) {
      catMap.set(m.category.id, {
        category: m.category,
        isExactName: false,
        maxPhraseLength: 0,
        matches: [],
      });
    }
    const item = catMap.get(m.category.id)!;
    if (m.isExactName) item.isExactName = true;
    if (m.phraseLength > item.maxPhraseLength) {
      item.maxPhraseLength = m.phraseLength;
    }
    item.matches.push(m);
  }

  // Also check if any unpruned match for this category was an exact name
  for (const m of matches) {
    if (m.isExactName && catMap.has(m.category.id)) {
      catMap.get(m.category.id)!.isExactName = true;
    }
  }

  const items = Array.from(catMap.values());
  if (items.length === 1) {
    return { ok: true, category: items[0].category };
  }

  // Tier 1: exact category names
  const exactItems = items.filter((it) => it.isExactName);
  const pool = exactItems.length > 0 ? exactItems : items;

  if (pool.length === 1) {
    return { ok: true, category: pool[0].category };
  }

  return {
    ok: false,
    error: `Kategori ambigu, ditemukan beberapa kategori yang cocok: ${pool.map((t) => t.category.name).join(', ')}.`,
  };
}

export function parseVoiceTransaction(
  transcript: string,
  categories: Category[],
  currentDateStr: string
): VoiceTransactionParseResult {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { ok: false, error: 'Ucapan tidak terdeteksi atau kosong.' };
  }

  const normalized = normalizeForParsing(trimmed);
  if (!normalized) {
    return { ok: false, error: 'Ucapan tidak terdeteksi atau kosong.' };
  }

  // 1. Amount extraction
  const candidates = extractNumberCandidates(normalized);
  if (candidates.length === 0) {
    return {
      ok: false,
      error:
        'Nominal transaksi tidak ditemukan. Sebutkan jumlah uang, misalnya dua puluh lima ribu atau 25.000.',
    };
  }

  let winningCandidate: NumberCandidate;
  const markedCandidates = candidates.filter((c) => c.hasMarker);

  if (markedCandidates.length > 1) {
    return {
      ok: false,
      error:
        'Terdapat lebih dari satu nominal dalam ucapan. Sebutkan satu nominal transaksi saja.',
    };
  } else if (markedCandidates.length === 1) {
    winningCandidate = markedCandidates[0];
  } else {
    // None has explicit marker
    if (candidates.length > 1) {
      return {
        ok: false,
        error:
          'Terdapat lebih dari satu angka dalam ucapan. Mohon perjelas nominal transaksi dengan menyebutkan satuan rupiah atau ribu.',
      };
    }
    winningCandidate = candidates[0];
  }

  const amount = winningCandidate.value;
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      error: 'Nominal transaksi harus lebih besar dari Rp0.',
    };
  }
  if (amount > MAX_AMOUNT) {
    return {
      ok: false,
      error: `Nominal transaksi melebihi batas maksimum (Rp${MAX_AMOUNT.toLocaleString('id-ID')}).`,
    };
  }

  // 2. Type inference
  const hasIncomeCue = INCOME_CUES.some((cue) =>
    new RegExp(`\\b${cue}\\b`, 'i').test(normalized)
  );
  const hasExpenseCue = EXPENSE_CUES.some((cue) =>
    new RegExp(`\\b${cue}\\b`, 'i').test(normalized)
  );

  if (hasIncomeCue && hasExpenseCue) {
    return {
      ok: false,
      error:
        'Terdapat petunjuk pemasukan dan pengeluaran sekaligus dalam ucapan. Mohon perjelas jenis transaksi.',
    };
  }

  let explicitType: 'income' | 'expense' | null = null;
  if (hasIncomeCue) explicitType = 'income';
  else if (hasExpenseCue) explicitType = 'expense';

  // 3. Category matching
  const activeCategories = categories.filter((c) => !c.archived_at);

  const matches: CategoryMatch[] = [];
  for (const cat of activeCategories) {
    const catLower = cat.name.toLowerCase();
    const exactRegex = new RegExp(
      `\\b${catLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    );
    const exactMatch = exactRegex.exec(normalized);
    if (exactMatch) {
      matches.push({
        category: cat,
        matchedPhrase: catLower,
        isExactName: true,
        phraseLength: catLower.length,
        start: exactMatch.index,
        end: exactMatch.index + exactMatch[0].length,
      });
    }

    const aliases = SEEDED_ALIASES[catLower];
    if (aliases) {
      for (const alias of aliases) {
        if (alias === catLower) continue;
        const aliasRegex = new RegExp(
          `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}\\b`,
          'i'
        );
        const aliasMatch = aliasRegex.exec(normalized);
        if (aliasMatch) {
          matches.push({
            category: cat,
            matchedPhrase: alias,
            isExactName: false,
            phraseLength: alias.length,
            start: aliasMatch.index,
            end: aliasMatch.index + aliasMatch[0].length,
          });
        }
      }
    }
  }

  let resolvedCategory: Category;
  let resolvedType: 'income' | 'expense';

  if (explicitType) {
    const matchingType = matches.filter(
      (m) => m.category.type === explicitType
    );
    const conflictingType = matches.filter(
      (m) => m.category.type !== explicitType
    );

    if (matchingType.length === 0 && conflictingType.length > 0) {
      return {
        ok: false,
        error: `Kategori "${conflictingType[0].category.name}" adalah ${conflictingType[0].category.type === 'income' ? 'pemasukan' : 'pengeluaran'}, tetapi ucapan menunjukkan ${explicitType === 'income' ? 'pemasukan' : 'pengeluaran'}.`,
      };
    }

    if (matchingType.length === 0) {
      const fallback = activeCategories.find(
        (c) => c.type === explicitType && c.name.toLowerCase() === 'lainnya'
      );
      if (!fallback) {
        return {
          ok: false,
          error: `Kategori default "Lainnya" untuk ${explicitType === 'income' ? 'pemasukan' : 'pengeluaran'} tidak ditemukan.`,
        };
      }
      resolvedCategory = fallback;
    } else {
      const res = pickBestCategory(matchingType);
      if (!res.ok) return res;
      resolvedCategory = res.category;
    }
    resolvedType = explicitType;
  } else {
    if (matches.length === 0) {
      return {
        ok: false,
        error:
          'Jenis transaksi (pemasukan/pengeluaran) atau kategori tidak dapat dikenali.',
      };
    }
    const res = pickBestCategory(matches);
    if (!res.ok) return res;
    resolvedCategory = res.category;
    resolvedType = resolvedCategory.type;
  }

  // 4. Date parsing (relative date cues)
  const hasHariIni = /\bhari\s+ini\b/i.test(normalized);
  const hasKemarin = /\bkemarin\b/i.test(normalized);
  const hasBesok = /\bbesok\b/i.test(normalized);

  const dateCueCount =
    (hasHariIni ? 1 : 0) + (hasKemarin ? 1 : 0) + (hasBesok ? 1 : 0);
  if (dateCueCount > 1) {
    return {
      ok: false,
      error:
        'Terdapat lebih dari satu keterangan waktu dalam ucapan (hari ini / kemarin / besok).',
    };
  }

  let finalDateStr = currentDateStr;
  if (dateCueCount === 1) {
    const now = new Date();
    let offsetDays = 0;
    if (hasKemarin) offsetDays = -1;
    else if (hasBesok) offsetDays = 1;
    else if (hasHariIni) offsetDays = 0;

    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offsetDays
    );
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    finalDateStr = `${y}-${m}-${d}`;
  }

  // 5. Note
  const note = trimmed.slice(0, MAX_NOTE_LENGTH);

  return {
    ok: true,
    value: {
      type: resolvedType,
      amount,
      category: resolvedCategory,
      note,
      dateStr: finalDateStr,
    },
  };
}
