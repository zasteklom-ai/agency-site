/**
 * Утилиты одноразовой чистки данных коттеджей:
 * - cleanDescription: HTML из фида → plain text (фронт рендерит описание как text с whitespace-pre-line)
 * - deriveBedrooms: консервативный пересчёт числа спален только по явным формулировкам
 *   ("N спален", "N спальни", "спальных комнат N", "N спальных комнат"; число можно цифрами или словом).
 *   Формулировка "N спальных мест" — это вместимость (beds), НЕ спальни.
 */

const ENTITIES: Record<string, string> = {
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  bull: "•",
  sup2: "²",
  quot: '"',
  hellip: "…",
  hearts: "♥",
  times: "×",
  rsquo: "’",
  deg: "°",
  nbsp: " ",
  zwj: "", // zero-width joiner из эмодзи-разметки, в plain text не нужен
};

export function cleanDescription(html: string | null): string | null {
  if (!html) return html;

  let s = html;
  // Блочные теги → переносы строк (порядок важен: <br> до остальных)
  s = s.replace(/<br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\/(p|h[1-6]|li|ul|ol|div|tr)>/gi, "\n");
  s = s.replace(/<(p|h[1-6]|ul|ol|li|div|tr)[^>]*>/gi, "");
  // Строчные теги — просто снимаем
  s = s.replace(/<\/?(span|strong|b|i|em|u|s|a|font|sub|sup)[^>]*>/gi, "");
  // Всё остальное неразобранное
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, "");

  // HTML-сущности (&amp; — последним, чтобы не декодировать дважды)
  s = s.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name: string) => ENTITIES[name] ?? m);
  s = s.replace(/&#(\d+);/g, (m, code: string) =>
    Number.isFinite(+code) ? String.fromCodePoint(+code) : m,
  );
  s = s.replace(/&amp;/g, "&");

  // Причесываем whitespace; разделитель блоков — одиночный \n (фид верстает <p>-построчно)
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{2,}/g, "\n");
  return s.trim();
}

interface BedroomInput {
  description: string | null;
  title: string | null;
  totalArea: number | null;
}

// Числа словами (1–20) — в описаниях часто пишут «пять спален», «две спальни»
const NUM_WORDS: Record<string, number> = {
  одна: 1,
  один: 1,
  две: 2,
  два: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  одиннадцать: 11,
  двенадцать: 12,
  тринадцать: 13,
  четырнадцать: 14,
  пятнадцать: 15,
  шестнадцать: 16,
  семнадцать: 17,
  восемнадцать: 18,
  девятнадцать: 19,
  двадцать: 20,
};

const NUM = "(\\d{1,2}|" + Object.keys(NUM_WORDS).join("|") + ")";
// Разделитель — только пробел/таб, НЕ перевод строки: иначе «14 человек\nСпальни» даёт ложное совпадение.
const NUM_SEP = "[ \\t]+";
const ADJ = "(?:[а-яё]{3,}[ \\t]+){0,2}";

// ВАЖНО: \b в JS не считает кириллицу «словесными» символами даже с флагом u,
// поэтому граница слова — через lookahead (?![а-яё]).
// Все паттерны: «спальных мест» сюда не входит — это beds, а не спальни.
export const BEDROOM_PATTERNS: RegExp[] = [
  new RegExp(NUM + NUM_SEP + ADJ + "спальн[ыи]х\\s+комнат", "giu"), // "10 спальных комнат"
  new RegExp("спальн[ыи]х\\s+комнат\\w*\\s*[-:=]?\\s*(\\d{1,2})", "giu"), // "Спальных комнат 6"
  new RegExp(NUM + NUM_SEP + ADJ + "спален(?![а-яё])", "giu"), // "5 спален", "7 отдельных спален"
  new RegExp(NUM + NUM_SEP + ADJ + "спальн(?:ья|и|ю|ей|ями)?(?![а-яё])", "giu"), // "4 спальни", "4 больших спальни"
];

// Нижняя граница площади на спальню: меньше ~15 м² на спальню — почти наверняка ошибка парсинга.
function plausible(value: number, totalArea: number | null): boolean {
  if (value < 1 || value > 20) return false;
  if (totalArea != null && value > Math.max(4, Math.floor(totalArea / 15))) return false;
  return true;
}

function toNumber(token: string): number {
  return /^\d+$/.test(token) ? parseInt(token, 10) : (NUM_WORDS[token.toLowerCase()] ?? NaN);
}

export function deriveBedrooms({ description, title, totalArea }: BedroomInput): number | null {
  const text = `${title ?? ""}\n${description ?? ""}`;
  interface Hit {
    index: number;
    value: number;
  }
  const hits: Hit[] = [];
  for (const re of BEDROOM_PATTERNS) {
    for (const m of text.matchAll(re)) {
      hits.push({ index: m.index ?? 0, value: toNumber(m[1]) });
    }
  }
  // Первое упоминание в тексте, проходящее проверку на здравый смысл
  hits.sort((a, b) => a.index - b.index);
  for (const h of hits) {
    if (plausible(h.value, totalArea)) return h.value;
  }
  return null;
}
