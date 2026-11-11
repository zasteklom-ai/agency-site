import { relations } from "drizzle-orm";
import { cottages, cottagePhotos } from "./schema";

export const cottagesRelations = relations(cottages, ({ many }) => ({
  photos: many(cottagePhotos),
}));

export const cottagePhotosRelations = relations(cottagePhotos, ({ one }) => ({
  cottage: one(cottages, {
    fields: [cottagePhotos.cottageId],
    references: [cottages.id],
  }),
}));
