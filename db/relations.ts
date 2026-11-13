import { relations } from "drizzle-orm";
import { bookings, cottages, cottagePhotos } from "./schema";

export const cottagesRelations = relations(cottages, ({ many }) => ({
  photos: many(cottagePhotos),
  bookings: many(bookings),
}));

export const cottagePhotosRelations = relations(cottagePhotos, ({ one }) => ({
  cottage: one(cottages, {
    fields: [cottagePhotos.cottageId],
    references: [cottages.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  cottage: one(cottages, {
    fields: [bookings.cottageId],
    references: [cottages.id],
  }),
}));
