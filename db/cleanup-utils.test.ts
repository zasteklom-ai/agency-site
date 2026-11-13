import { describe, expect, it } from "vitest";
import { cleanDescription, deriveBedrooms } from "./cleanup-utils";

// Чистка фида коттеджей: описания приходят с HTML-тегами Авито/ЦИАН,
// число спален в фиде парсилось по фразе «N спальных мест» — это вместимость, а не спальни.

describe("cleanDescription", () => {
  it("снимает <p>/<br> и раскладывает по строкам", () => {
    const html = "<p>Первый абзац</p>\n<p>Второй<br />с переносом</p>";
    expect(cleanDescription(html)).toBe("Первый абзац\nВторой\nс переносом");
  });

  it("снимает строчные теги, не ломая текст", () => {
    expect(cleanDescription("<p><strong>Дом</strong> <span>у озера</span></p>")).toBe("Дом у озера");
  });

  it("декодирует HTML-сущности", () => {
    expect(cleanDescription("&laquo;Дом&raquo; &mdash; 90&nbsp;&sup2;")).toBe("«Дом» — 90 ²");
  });

  it("списки превращает в строки без мусора", () => {
    expect(cleanDescription("<ul><li>Баня</li><li>Сауна</li></ul>")).toBe("Баня\nСауна");
  });

  it("null проходит как есть", () => {
    expect(cleanDescription(null)).toBeNull();
  });

  it("схлопывает серии пустых строк", () => {
    expect(cleanDescription("<p>a</p>\n\n\n\n<p>b</p>")).toBe("a\nb");
  });
});

describe("deriveBedrooms", () => {
  const base = { description: null, title: null, totalArea: null };

  it("«N спален» — спальни", () => {
    expect(deriveBedrooms({ ...base, description: "В доме 5 спален с кроватями" })).toBe(5);
  });

  it("«N спальных мест» — НЕ спальни (это вместимость)", () => {
    expect(deriveBedrooms({ ...base, description: "Дом рассчитан на 18 спальных мест" })).toBeNull();
    expect(deriveBedrooms({ ...base, description: "до 24 спальных мест" })).toBeNull();
  });

  it("число словом тоже считается", () => {
    expect(deriveBedrooms({ ...base, description: "пять отдельных спален" })).toBe(5);
    expect(deriveBedrooms({ ...base, description: "две спальни" })).toBe(2);
  });

  it("число через перенос строки не цепляет заголовок списка", () => {
    expect(deriveBedrooms({ ...base, description: "Вместимость: 14 человек\nСпальни: на первом этаже" })).toBeNull();
  });

  it("«спальных комнат 6» и «10 спальных комнат»", () => {
    expect(deriveBedrooms({ ...base, description: "Спальных комнат 6, до 23 спальных мест" })).toBe(6);
    expect(deriveBedrooms({ ...base, description: "- 10 спальных комнат с мебелью" })).toBe(10);
  });

  it("первое упоминание в тексте, а не самый большой этаж", () => {
    const d = "В доме 5 спален с двухместными кроватями. На 2 этаже располагаются 3 спальных комнаты";
    expect(deriveBedrooms({ ...base, description: d })).toBe(5);
  });

  it("антимусор: нереалистичные значения отбрасываются", () => {
    expect(deriveBedrooms({ ...base, description: "7 спален", totalArea: 74 })).toBeNull();
    expect(deriveBedrooms({ ...base, description: "25 спален", totalArea: 700 })).toBeNull();
  });

  it("берёт из заголовка, если в описании нет", () => {
    expect(deriveBedrooms({ ...base, title: "Коттедж 3 спальни" })).toBe(3);
    expect(deriveBedrooms({ ...base, title: "Коттедж 8 спален до 16 человек" })).toBe(8);
  });

  it("прилагательные между числом и словом не мешают", () => {
    expect(deriveBedrooms({ ...base, description: "7 отдельных спален" })).toBe(7);
    expect(deriveBedrooms({ ...base, description: "4 больших спальни" })).toBe(4);
    expect(deriveBedrooms({ ...base, description: "2 отдельными спальнями" })).toBe(2);
  });

  it("«спальная кровать» без числа не подходит", () => {
    expect(deriveBedrooms({ ...base, description: "двуспальная кровать и диван" })).toBeNull();
  });
});
