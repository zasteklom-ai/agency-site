import { XMLParser } from "fast-xml-parser";

// Парсер XML-фида Яндекс.Недвижимости (realty-feed, xmlns
// http://webmaster.yandex.ru/schemas/feed/realty/2010-06). Пространства имён
// срезаем (removeNSPrefix): партнёрские расширения (yandex:beds и т.п.)
// попадают под общие имена тегов. Все значения читаем строками и парсим
// сами — контроль над числами и отсутствие сюрпризов от авто-приведений.

export interface FeedOffer {
  externalId: string;
  title: string;
  description: string | null;
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  beds: number | null;
  totalArea: number | null;
  landArea: number | null;
  price: number | null;
  amenities: string[];
  photos: string[];
}

export interface FeedError {
  /** Индекс <offer> в фиде (0-based) — для сообщений вида «offer #12» */
  index: number;
  externalId: string | null;
  message: string;
}

export interface FeedParseResult {
  offers: FeedOffer[];
  errors: FeedError[];
}

export const MAX_OFFERS_PER_FEED = 1000;
export const MAX_PHOTOS_PER_OFFER = 30;

type XmlRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (tagName) => ["offer", "image", "price", "amenity"].includes(tagName),
});

function asRecord(v: unknown): XmlRecord {
  return v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as XmlRecord)
    : {};
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function text(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") {
    const s = String(v).trim();
    return s === "" ? null : s;
  }
  if (typeof v === "object" && !Array.isArray(v)) {
    // <tag>text</tag> при смешанном содержимом: текст лежит в "#text"
    return text((v as XmlRecord)["#text"]);
  }
  return null;
}

function num(v: unknown): number | null {
  const s = text(v);
  if (!s) return null;
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function intOrNull(n: number | null): number | null {
  return n == null ? null : Math.round(n);
}

/** Булевы «удобства» из фида: сигналом служит само наличие тега
 * (<sauna/>) или правдивое значение ("1", "true", "да"). */
function truthyTag(v: unknown): boolean {
  if (v == null) return false;
  const s = text(v);
  if (s == null) return true; // пустой тег — считаем наличием признака
  return ["1", "true", "yes", "да", "y"].includes(s.toLowerCase());
}

const AMENITY_RULES = [
  { key: "banya", flag: "hasBanya", label: "Баня", match: ["баня", "банный"] },
  { key: "sauna", flag: "hasSauna", label: "Сауна", match: ["сауна"] },
  { key: "pool", flag: "hasPool", label: "Бассейн", match: ["бассейн"] },
  { key: "kupel", flag: "hasKupel", label: "Купель", match: ["купель"] },
  { key: "billiard", flag: "hasBilliard", label: "Бильярд", match: ["бильярд"] },
  { key: "barbecue", flag: "hasBbq", label: "Мангал/барбекю", match: ["мангал", "барбекю", "гриль"] },
] as const;

type AmenityFlag = (typeof AMENITY_RULES)[number]["flag"];

/** Булевы флаги фильтров из списка удобств — тот же словарь, что и в
 * админской форме (admin.updateCottage маппит «Баня» → hasBanya и т.д.). */
export function amenityFlags(labels: string[]): Record<AmenityFlag, boolean> {
  const out = Object.fromEntries(AMENITY_RULES.map((r) => [r.flag, false])) as Record<AmenityFlag, boolean>;
  for (const rule of AMENITY_RULES) {
    if (labels.includes(rule.label)) out[rule.flag] = true;
  }
  return out;
}

export interface FeedAmenities {
  list: string[];
  flags: Record<AmenityFlag, boolean>;
}

function collectAmenities(offer: XmlRecord): FeedAmenities {
  const signals: string[] = [];

  // 1. Теги уровня offer: <sauna>1</sauna>, <pool/>, <barbecue>да</barbecue>
  for (const rule of AMENITY_RULES) {
    if (rule.key in offer && truthyTag(offer[rule.key])) {
      signals.push(rule.match[0]);
    }
  }

  // 2. <amenities><sauna/><pool/></amenities> — по именам дочерних тегов
  const amenitiesNode = asRecord(offer["amenities"]);
  for (const rule of AMENITY_RULES) {
    if (rule.key in amenitiesNode && truthyTag(amenitiesNode[rule.key])) {
      signals.push(rule.match[0]);
    }
  }

  // 3. Повторяющиеся <amenity>текст</amenity> — по словарю в тексте
  for (const a of asArray(offer["amenity"])) {
    const s = text(a);
    if (s) signals.push(s.toLowerCase());
  }
  for (const a of asArray(amenitiesNode["amenity"])) {
    const s = text(a);
    if (s) signals.push(s.toLowerCase());
  }

  const flags = Object.fromEntries(
    AMENITY_RULES.map((r) => [r.flag, false]),
  ) as Record<AmenityFlag, boolean>;
  const list: string[] = [];
  for (const rule of AMENITY_RULES) {
    const hit = rule.match.some((word) => signals.some((s) => s.includes(word)));
    if (hit) {
      flags[rule.flag] = true;
      list.push(rule.label);
    }
  }
  return { list, flags };
}

/** Собираем адрес из частей location: <address> в фиде часто содержит
 * только улицу, а на сайте нужен полный адрес для карточки и SEO. */
function buildAddress(loc: XmlRecord): string | null {
  const parts = [
    text(loc["region"]),
    text(loc["district"]),
    text(loc["locality-name"]),
    text(loc["sub-locality-name"]),
    text(loc["address"]),
  ].filter((p): p is string => !!p);
  if (parts.length === 0) return null;
  // Район может повторяться в адресе («Выборгский район, ... Выборгский район») — дедублим подряд идущие
  return parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(", ");
}

function parseArea(v: unknown): { value: number; unit: string } | null {
  const rec = asRecord(v);
  const value = num(rec["@_value"] ?? (typeof v === "string" || typeof v === "number" ? v : null));
  if (value == null) return null;
  return { value, unit: text(rec["@_unit"])?.toLowerCase() ?? "" };
}

function parseOffer(node: unknown, index: number): { offer?: FeedOffer; error?: FeedError } {
  const o = asRecord(node);
  const externalId = text(o["@_internal-id"]);
  const title = text(o["title"]);

  if (!externalId) {
    return { error: { index, externalId: null, message: "нет атрибута internal-id" } };
  }
  if (!title) {
    return { error: { index, externalId, message: "нет <title>" } };
  }

  const loc = asRecord(o["location"]);

  let lat = num(loc["latitude"]);
  let lng = num(loc["longitude"]);
  if (lat != null && (lat < -90 || lat > 90)) lat = null;
  if (lng != null && (lng < -180 || lng > 180)) lng = null;

  // Цена: берём период «день» (посуточная аренда), иначе первую.
  // Валюта не RUB — цену не берём: пересчёта курсов в проекте нет.
  let price: number | null = null;
  const prices = asArray(o["price"]);
  const pick =
    prices.find((p) => text(asRecord(p)["@_period"]) === "день") ?? prices[0];
  if (pick != null) {
    const rec = asRecord(pick);
    const currency = text(rec["@_currency"]);
    if (!currency || currency.toUpperCase() === "RUB") {
      price = intOrNull(num(rec["@_value"] ?? text(rec)));
    }
  }

  const area = parseArea(o["area"]);
  const land = parseArea(o["land-area"]);
  const landArea =
    land == null
      ? null
      : land.unit.startsWith("сот")
        ? land.value
        : land.unit.startsWith("га")
          ? land.value * 100
          : land.value / 10_000; // кв. м → сотки

  const amenities = collectAmenities(o);

  const seen = new Set<string>();
  const photos: string[] = [];
  for (const img of asArray(o["image"])) {
    const u = text(img);
    if (!u || !/^https?:\/\//i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    if (photos.length < MAX_PHOTOS_PER_OFFER) photos.push(u);
  }

  return {
    offer: {
      externalId,
      title,
      description: text(o["description"]),
      address: buildAddress(loc),
      district: text(loc["district"]) ?? text(loc["locality-name"]) ?? text(loc["region"]),
      lat,
      lng,
      bedrooms: intOrNull(num(o["bedrooms"] ?? o["bedrooms-count"])),
      beds: intOrNull(num(o["beds"] ?? o["sleeping-places"] ?? o["sleep-places"])),
      totalArea: area?.unit.startsWith("сот") ? null : area?.value ?? null,
      landArea: landArea != null ? Math.round(landArea * 100) / 100 : null,
      price,
      amenities: amenities.list,
      photos,
    },
  };
}

export function parseFeedXml(xml: string): FeedParseResult {
  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch (e) {
    throw new Error(`XML не разобран: ${e instanceof Error ? e.message : String(e)}`);
  }
  const feed = asRecord(asRecord(doc)["realty-feed"]);
  const offerNodes = asArray(feed["offer"]);
  if (offerNodes.length === 0) {
    throw new Error("В фиде нет ни одного <offer> (корень <realty-feed>)");
  }
  if (offerNodes.length > MAX_OFFERS_PER_FEED) {
    throw new Error(
      `В фиде ${offerNodes.length} объектов — больше лимита ${MAX_OFFERS_PER_FEED}. Разбейте фид на части.`,
    );
  }

  const offers: FeedOffer[] = [];
  const errors: FeedError[] = [];
  const seenIds = new Map<string, number>();
  offerNodes.forEach((node, index) => {
    const { offer, error } = parseOffer(node, index);
    if (error) {
      errors.push(error);
      return;
    }
    const prev = seenIds.get(offer!.externalId);
    if (prev != null) {
      errors.push({
        index,
        externalId: offer!.externalId,
        message: `дубликат internal-id (уже встречался в offer #${prev + 1}), пропущен`,
      });
      return;
    }
    seenIds.set(offer!.externalId, index);
    offers.push(offer!);
  });

  return { offers, errors };
}
