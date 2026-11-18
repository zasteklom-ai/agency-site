import { describe, expect, it } from "vitest";
import { parseFeedXml } from "./xml-feed";

// Парсер realty-feed Яндекс.Недвижимости. Лочим: namespace-агностичность
// (yandex:beds), выбор посуточной цены, сборку адреса из частей location,
// словарь удобств из тегов/текстов и жёсткость к битым offer-ам.

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<realty-feed xmlns="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">
  <generation-date>2026-11-17T12:00:00+03:00</generation-date>
  <offer internal-id="1001">
    <type>аренда</type>
    <category>коттедж</category>
    <title>Коттедж 600 м² на участке 15 сот.</title>
    <description><![CDATA[В доме: бассейн, сауна, бильярдная.]]></description>
    <location>
      <country>Россия</country>
      <region>Ленинградская область</region>
      <district>Выборгский район</district>
      <locality-name>посёлок Матросово</locality-name>
      <address>улица Тихая, 62</address>
      <latitude>60.64283</latitude>
      <longitude>28.710615</longitude>
    </location>
    <price value="60000" currency="RUB" period="день">60000</price>
    <price value="400000" currency="RUB" period="месяц"/>
    <area value="600" unit="кв. м"/>
    <land-area value="15" unit="сот"/>
    <bedrooms>5</bedrooms>
    <yandex:beds xmlns:yandex="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">14</yandex:beds>
    <image>https://img.example.ru/1.jpg</image>
    <image>https://img.example.ru/2.jpg</image>
    <image>https://img.example.ru/1.jpg</image>
    <amenities>
      <sauna>true</sauna>
      <pool/>
    </amenities>
  </offer>
  <offer internal-id="1002">
    <type>аренда</type>
    <title>Дом с баней и мангалом</title>
    <location>
      <region>Ленинградская область</region>
      <locality-name>посёлок Зеленый</locality-name>
    </location>
    <price value="25000" currency="USD" period="день"/>
    <land-area value="2000" unit="кв. м"/>
    <amenity>Баня на дровах</amenity>
    <amenity>Мангал</amenity>
    <amenity>Купель горячая</amenity>
  </offer>
</realty-feed>`;

describe("parseFeedXml", () => {
  it("разбирает offer со всеми полями", () => {
    const { offers, errors } = parseFeedXml(FEED);
    expect(errors).toEqual([]);
    expect(offers).toHaveLength(2);

    const o = offers[0];
    expect(o.externalId).toBe("1001");
    expect(o.title).toContain("600 м²");
    expect(o.description).toContain("бассейн");
    // Цена периода «день», а не «месяц»
    expect(o.price).toBe(60000);
    expect(o.bedrooms).toBe(5);
    // Пространство имён срезано: yandex:beds → beds
    expect(o.beds).toBe(14);
    expect(o.totalArea).toBe(600);
    expect(o.landArea).toBe(15);
    // Адрес собран из частей location
    expect(o.address).toBe(
      "Ленинградская область, Выборгский район, посёлок Матросово, улица Тихая, 62",
    );
    expect(o.district).toBe("Выборгский район");
    expect(o.lat).toBeCloseTo(60.64283);
    expect(o.lng).toBeCloseTo(28.710615);
    // Дубликат image отброшен
    expect(o.photos).toEqual([
      "https://img.example.ru/1.jpg",
      "https://img.example.ru/2.jpg",
    ]);
    // Удобства из <amenities> по именам тегов
    expect(o.amenities).toEqual(expect.arrayContaining(["Сауна", "Бассейн"]));
  });

  it("валюта не-RUB → цена null, кв.м участка → сотки, удобства из текста", () => {
    const { offers } = parseFeedXml(FEED);
    const o = offers[1];
    expect(o.price).toBeNull();
    expect(o.landArea).toBe(0.2);
    expect(o.address).toBe("Ленинградская область, посёлок Зеленый");
    expect(o.district).toBe("посёлок Зеленый");
    expect(o.amenities).toEqual(
      expect.arrayContaining(["Баня", "Мангал/барбекю", "Купель"]),
    );
  });

  it("пропускает offer без internal-id и дубликаты id", () => {
    const xml = `<realty-feed xmlns="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">
      <offer><title>Без id</title></offer>
      <offer internal-id="7"><title>Первый</title></offer>
      <offer internal-id="7"><title>Дубль</title></offer>
      <offer internal-id="8"><title>Второй</title></offer>
    </realty-feed>`;
    const { offers, errors } = parseFeedXml(xml);
    expect(offers.map((o) => o.externalId)).toEqual(["7", "8"]);
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain("internal-id");
    expect(errors[1].message).toContain("дубликат");
  });

  it("ошибка на пустом фиде и на лимите offer-ов", () => {
    expect(() => parseFeedXml("<realty-feed/>")).toThrow(/offer/);
    const many =
      `<realty-feed>` +
      Array.from({ length: 1001 }, (_, i) => `<offer internal-id="${i}"><title>t${i}</title></offer>`).join("") +
      `</realty-feed>`;
    expect(() => parseFeedXml(many)).toThrow(/лимита/);
  });
});
