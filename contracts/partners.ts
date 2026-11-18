// Контракты партнёрских площадок: zod-схемы общие для фронта, бэка и сидов.
// Площадка = скалярные поля (редактируются в админке) + content — структурные
// разделы (залы, проживание, мероприятия, услуги), хранятся в БД как JSON.

import { z } from "zod";
import { parseVkVideoUrl } from "./vk-video";
import { parseRutubeVideoUrl } from "./rutube-video";

export const partnerStatSchema = z.object({
  value: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(128),
});

export const partnerPhotoSchema = z.object({
  src: z.string().trim().min(1).max(512),
  alt: z.string().trim().max(255).default(""),
});

export const partnerHallSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(191),
  badge: z.string().trim().max(128).optional(),
  banquet: z.number().int().min(0),
  buffet: z.number().int().min(0),
  lead: z.string().trim().max(512).default(""),
  description: z.array(z.string().max(4000)).default([]),
  features: z.array(z.string().trim().max(255)).default([]),
  photos: z.array(partnerPhotoSchema).default([]),
});

export const partnerAccommodationSchema = z.object({
  title: z.string().trim().min(1).max(191),
  lead: z.string().trim().max(512).default(""),
  description: z.array(z.string().max(4000)).default([]),
  features: z.array(z.string().trim().max(255)).default([]),
  photos: z.array(partnerPhotoSchema).default([]),
});

export const partnerEventSchema = z.object({
  icon: z.string().trim().max(64).default("sparkles"),
  title: z.string().trim().min(1).max(191),
  description: z.string().trim().max(2000).default(""),
  photo: partnerPhotoSchema,
});

export const partnerServiceSchema = z.object({
  icon: z.string().trim().max(64).default("sparkles"),
  title: z.string().trim().min(1).max(191),
  description: z.string().trim().max(2000).default(""),
  price: z.string().trim().max(64).optional(),
});

export const partnerAboutSchema = z.object({
  title: z.string().trim().min(1).max(191),
  paragraphs: z.array(z.string().max(4000)).min(1),
});

// Банкетное меню: варианты (Лайт/Классик/…/Детское/Фуршет) с секциями блюд.
export const partnerMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(191),
  description: z.string().trim().max(1000).default(""),
  portion: z.string().trim().max(64).default(""),
});

export const partnerMenuSectionSchema = z.object({
  title: z.string().trim().min(1).max(191),
  items: z.array(partnerMenuItemSchema).default([]),
});

export const partnerMenuVariantSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(191),
  price: z.string().trim().max(64).default(""),
  note: z.string().trim().max(500).default(""),
  sections: z.array(partnerMenuSectionSchema).default([]),
});

// Структурные разделы страницы площадки — один JSON-столбец в БД.
export const partnerContentSchema = z.object({
  stats: z.array(partnerStatSchema).default([]),
  about: partnerAboutSchema,
  territoryPhotos: z.array(partnerPhotoSchema).default([]),
  hallsTitle: z.string().trim().max(191).default("Банкетные залы"),
  hallsIntro: z.string().trim().max(2000).default(""),
  halls: z.array(partnerHallSchema).default([]),
  accommodation: partnerAccommodationSchema.nullable().default(null),
  eventsTitle: z.string().trim().max(191).default("Форматы мероприятий"),
  eventsIntro: z.string().trim().max(2000).default(""),
  events: z.array(partnerEventSchema).default([]),
  servicesTitle: z.string().trim().max(191).default("Дополнительные услуги"),
  servicesIntro: z.string().trim().max(2000).default(""),
  servicesNote: z.string().trim().max(500).default(""),
  services: z.array(partnerServiceSchema).default([]),
  servicesPhotos: z.array(partnerPhotoSchema).default([]),
  menusTitle: z.string().trim().max(191).default("Банкетное меню"),
  menusIntro: z.string().trim().max(2000).default(""),
  menusNote: z.string().trim().max(500).default(""),
  menus: z.array(partnerMenuVariantSchema).default([]),
});

export type PartnerStat = z.infer<typeof partnerStatSchema>;
export type PartnerPhoto = z.infer<typeof partnerPhotoSchema>;
export type PartnerHall = z.infer<typeof partnerHallSchema>;
export type PartnerAccommodation = z.infer<typeof partnerAccommodationSchema>;
export type PartnerEvent = z.infer<typeof partnerEventSchema>;
export type PartnerService = z.infer<typeof partnerServiceSchema>;
export type PartnerMenuItem = z.infer<typeof partnerMenuItemSchema>;
export type PartnerMenuSection = z.infer<typeof partnerMenuSectionSchema>;
export type PartnerMenuVariant = z.infer<typeof partnerMenuVariantSchema>;
export type PartnerContent = z.infer<typeof partnerContentSchema>;

// Ссылка на видео: Rutube или VK Видео; пустая строка — видео нет.
export const partnerVideoUrlSchema = z
  .string()
  .trim()
  .max(1024)
  .refine((u) => u === "" || parseVkVideoUrl(u) !== null || parseRutubeVideoUrl(u) !== null, {
    message:
      "Непонятная ссылка на видео. Примеры: https://rutube.ru/video/… или https://vkvideo.ru/video-123456_789",
  });

export const partnerSlugSchema = z
  .string()
  .trim()
  .min(1, "Укажите slug")
  .max(191)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы");

// Скалярные поля, которые редактируются отдельными инпутами в админке.
export const partnerScalarsSchema = z.object({
  slug: partnerSlugSchema,
  name: z.string().trim().min(1, "Укажите название").max(191),
  tagline: z.string().trim().max(255).default(""),
  excerpt: z.string().trim().max(2000).default(""),
  location: z.string().trim().max(191).default(""),
  heroImage: z.string().trim().max(512).default(""),
  heroAlt: z.string().trim().max(255).default(""),
  cardImage: z.string().trim().max(512).default(""),
  cardAlt: z.string().trim().max(255).default(""),
  metaTitle: z.string().trim().max(255).default(""),
  metaDescription: z.string().trim().max(512).default(""),
  territoryPlan: z.string().trim().max(512).default(""),
  territoryPlanAlt: z.string().trim().max(255).default(""),
  videoUrl: partnerVideoUrlSchema.default(""),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isPublished: z.boolean().default(true),
});

export type PartnerScalars = z.infer<typeof partnerScalarsSchema>;

// Полный ввод create/update: скаляры + контент.
export const partnerInputSchema = partnerScalarsSchema.extend({
  content: partnerContentSchema,
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

// Формат, в котором контент удобно хранить в исходниках (плоский):
// скаляры и разделы контента в одном объекте.
export type PartnerFlat = PartnerScalars & PartnerContent;

export function splitPartnerInput(flat: PartnerFlat): PartnerInput {
  const {
    stats,
    about,
    territoryPhotos,
    hallsTitle,
    hallsIntro,
    halls,
    accommodation,
    eventsTitle,
    eventsIntro,
    events,
    servicesTitle,
    servicesIntro,
    servicesNote,
    services,
    servicesPhotos,
    menusTitle,
    menusIntro,
    menusNote,
    menus,
    ...scalars
  } = flat;
  return {
    ...scalars,
    content: {
      stats,
      about,
      territoryPhotos,
      hallsTitle,
      hallsIntro,
      halls,
      accommodation,
      eventsTitle,
      eventsIntro,
      events,
      servicesTitle,
      servicesIntro,
      servicesNote,
      services,
      servicesPhotos,
      menusTitle,
      menusIntro,
      menusNote,
      menus,
    },
  };
}

export function emptyPartnerContent(): PartnerContent {
  return partnerContentSchema.parse({
    about: { title: "О площадке", paragraphs: [""] },
  });
}
