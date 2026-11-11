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
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
