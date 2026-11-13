import { readFileSync } from 'fs';
import { getDb } from '../api/queries/connection';
import { cottages, cottagePhotos } from './schema';

interface FeedCottage {
  externalId: string;
  title: string;
  description: string;
  address: string;
  district: string;
  lat: string | null;
  lng: string | null;
  bedrooms: number | null;
  beds: number | null;
  totalArea: number | null;
  landArea: number | null;
  price: number | null;
  hasBanya: boolean;
  hasSauna: boolean;
  hasPool: boolean;
  hasKupel: boolean;
  hasBilliard: boolean;
  hasBbq: boolean;
  localPhotos: string[];
}

async function main() {
  const data: FeedCottage[] = JSON.parse(
    readFileSync('./db/seed-data.json', 'utf-8'),
  );
  const db = getDb();

  for (const c of data) {
    const photos =
      c.localPhotos.length > 0
        ? c.localPhotos
        : ['/photos/placeholder.jpg'];
    const [result] = await db
      .insert(cottages)
      .values({
        externalId: c.externalId,
        title: c.title || `Коттедж ${c.externalId}`,
        description: c.description,
        address: c.address,
        district: c.district,
        lat: c.lat ? parseFloat(c.lat) : null,
        lng: c.lng ? parseFloat(c.lng) : null,
        bedrooms: c.bedrooms,
        beds: c.beds,
        totalArea: c.totalArea,
        landArea: c.landArea,
        price: c.price,
        hasBanya: c.hasBanya,
        hasSauna: c.hasSauna,
        hasPool: c.hasPool,
        hasKupel: c.hasKupel,
        hasBilliard: c.hasBilliard,
        hasBbq: c.hasBbq,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: c.title || `Коттедж ${c.externalId}`,
          description: c.description,
          price: c.price,
        },
      });

    const cottageId =
      result.insertId ||
      (
        await db.query.cottages.findFirst({
          where: (t, { eq }) => eq(t.externalId, c.externalId),
        })
      )?.id;

    if (!cottageId) continue;

    const { eq } = await import('drizzle-orm');
    await db.delete(cottagePhotos).where(eq(cottagePhotos.cottageId, cottageId as number));

    await db.insert(cottagePhotos).values(
      photos.map((url, i) => ({
        cottageId: cottageId as number,
        url,
        sortOrder: i,
      })),
    );
  }

  console.log(`Seeded ${data.length} cottages`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
