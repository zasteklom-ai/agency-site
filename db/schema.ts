import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  double,
  boolean,
  timestamp,
  bigint,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const cottages = mysqlTable("cottages", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 512 }),
  district: varchar("district", { length: 128 }),
  lat: double("lat"),
  lng: double("lng"),
  bedrooms: int("bedrooms"),
  beds: int("beds"),
  totalArea: double("total_area"),
  landArea: double("land_area"),
  price: int("price"),
  hasBanya: boolean("has_banya").notNull().default(false),
  hasSauna: boolean("has_sauna").notNull().default(false),
  hasPool: boolean("has_pool").notNull().default(false),
  hasKupel: boolean("has_kupel").notNull().default(false),
  hasBilliard: boolean("has_billiard").notNull().default(false),
  hasBbq: boolean("has_bbq").notNull().default(false),
  priceWeekday: int("price_weekday"),
  priceFriday: int("price_friday"),
  priceSaturday: int("price_saturday"),
  priceWeekend: int("price_weekend"),
  priceNewyear: int("price_newyear"),
  deposit: int("deposit"),
  amenities: text("amenities"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  icalExportToken: varchar("ical_export_token", { length: 64 }),
  icalImportAvitoUrl: varchar("ical_import_avito_url", { length: 1024 }),
  icalImportCianUrl: varchar("ical_import_cian_url", { length: 1024 }),
  videoUrl: varchar("video_url", { length: 1024 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const cottagePhotos = mysqlTable("cottage_photos", {
  id: serial("id").primaryKey(),
  cottageId: bigint("cottage_id", { mode: "number", unsigned: true }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const leads = mysqlTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  cottageId: bigint("cottage_id", { mode: "number", unsigned: true }),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  guests: int("guests"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Брони и блокировки дат. end_date — эксклюзивный (день выезда свободен):
// бронь 10→13 занимает ночи 10, 11, 12. Это же соглашение использует RFC 5545
// (DTEND для all-day событий эксклюзивен), поэтому iCal-импорт/экспорт
// не требует пересчёта границ. Поле source критично для iCal-синхронизации:
// внешние брони (AVITO/CIAN) read-only для ручных правок и не перезатирают MANUAL.
export const bookings = mysqlTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    cottageId: bigint("cottage_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => cottages.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: mysqlEnum("status", ["BOOKED", "BLOCKED", "AVAILABLE", "CANCELLED"])
      .notNull()
      .default("BOOKED"),
    source: mysqlEnum("source", ["MANUAL", "AVITO", "CIAN", "ICAL"])
      .notNull()
      .default("MANUAL"),
    externalUid: varchar("external_uid", { length: 128 }),
    priceOverride: int("price_override"),
    comment: varchar("comment", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    // Идемпотентность iCal-импорта: один внешний UID = одна строка.
    // NULL external_uid (ручные брони) в MySQL не конфликтуют по уникальному индексу.
    uniqueIndex("uq_bookings_external").on(t.cottageId, t.source, t.externalUid),
    // Индекс под запросы календаря: выборка пересечений по видимому диапазону.
    index("idx_bookings_cottage_range").on(t.cottageId, t.startDate),
  ],
);
