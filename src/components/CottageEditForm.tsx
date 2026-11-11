import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { X, ImagePlus, Trash2, ChevronUp } from "lucide-react";

export const AMENITY_OPTIONS = [
  "Баня",
  "Бассейн крытый",
  "Сауна",
  "Бассейн уличный",
  "Купель горячая",
  "Купель холодная",
  "Бильярд",
  "Настольный теннис",
  "Караоке",
  "Настольные игры",
  "Аудиосистема",
] as const;

interface CottageEditData {
  id: number;
  title: string;
  address: string | null;
  district: string | null;
  description: string | null;
  totalArea: number | null;
  bedrooms: number | null;
  beds: number | null;
  price: number | null;
  priceWeekday: number | null;
  priceFriday: number | null;
  priceSaturday: number | null;
  priceWeekend: number | null;
  priceNewyear: number | null;
  deposit: number | null;
  amenities: string | null;
  status: string;
}

const EMPTY_FORM = {
  title: "",
  address: "",
  district: "",
  description: "",
  totalArea: "",
  bedrooms: "",
  beds: "",
  price: "",
  priceWeekday: "",
  priceFriday: "",
  priceSaturday: "",
  priceWeekend: "",
  priceNewyear: "",
  deposit: "",
  status: "active",
};

export function CottageEditForm({
  cottage,
  token,
  onClose,
  onCreated,
}: {
  cottage: CottageEditData | null;
  token: string;
  onClose: () => void;
  onCreated?: (id: number) => void;
}) {
  const isNew = cottage === null;
  const [form, setForm] = useState(
    cottage
      ? {
          title: cottage.title,
          address: cottage.address ?? "",
          district: cottage.district ?? "",
          description: cottage.description ?? "",
          totalArea: cottage.totalArea?.toString() ?? "",
          bedrooms: cottage.bedrooms?.toString() ?? "",
          beds: cottage.beds?.toString() ?? "",
          price: cottage.price?.toString() ?? "",
          priceWeekday: cottage.priceWeekday?.toString() ?? "",
          priceFriday: cottage.priceFriday?.toString() ?? "",
          priceSaturday: cottage.priceSaturday?.toString() ?? "",
          priceWeekend: cottage.priceWeekend?.toString() ?? "",
          priceNewyear: cottage.priceNewyear?.toString() ?? "",
          deposit: cottage.deposit?.toString() ?? "",
          status: cottage.status,
        }
      : EMPTY_FORM,
  );
  const [amenities, setAmenities] = useState<string[]>(
    cottage?.amenities
      ? cottage.amenities.split(",").map((s) => s.trim())
      : [],
  );
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const invalidateAll = () => {
    utils.admin.listAll.invalidate();
    utils.cottages.list.invalidate();
    utils.cottages.byId.invalidate();
    utils.cottages.featured.invalidate();
  };

  const mutation = trpc.admin.updateCottage.useMutation({
    onSuccess: () => {
      invalidateAll();
      setSaved(true);
      setTimeout(() => onClose(), 800);
    },
  });

  const createMutation = trpc.admin.createCottage.useMutation({
    onSuccess: (res) => {
      invalidateAll();
      setSaved(true);
      setTimeout(() => {
        onClose();
        onCreated?.(res.id);
      }, 800);
    },
  });

  // Фото текущего объекта (только в режиме редактирования)
  const { data: cottageFull } = trpc.cottages.byId.useQuery(
    { id: cottage?.id ?? 0 },
    { enabled: !isNew && !!cottage },
  );
  const photos = cottageFull?.photos ?? [];

  const uploadMutation = trpc.admin.uploadPhoto.useMutation({
    onSuccess: () => utils.cottages.byId.invalidate(),
  });
  const deletePhotoMutation = trpc.admin.deletePhoto.useMutation({
    onSuccess: () => {
      utils.cottages.byId.invalidate();
      utils.admin.listAll.invalidate();
    },
  });
  const reorderMutation = trpc.admin.reorderPhotos.useMutation({
    onSuccess: () => {
      utils.cottages.byId.invalidate();
      utils.admin.listAll.invalidate();
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || !cottage) return;
    setUploading(files.length);
    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await uploadMutation.mutateAsync({
        token,
        cottageId: cottage.id,
        name: file.name,
        contentBase64: base64,
        contentType: file.type,
      });
      setUploading((n) => n - 1);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const num = (v: string) => (v === "" ? null : Number(v));

  const toggleAmenity = (a: string) =>
    setAmenities((list) =>
      list.includes(a) ? list.filter((x) => x !== a) : [...list, a],
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      token,
      title: form.title,
      address: form.address,
      district: form.district,
      description: form.description,
      totalArea: num(form.totalArea),
      bedrooms: num(form.bedrooms),
      beds: num(form.beds),
      price: num(form.price),
      priceWeekday: num(form.priceWeekday),
      priceFriday: num(form.priceFriday),
      priceSaturday: num(form.priceSaturday),
      priceWeekend: num(form.priceWeekend),
      priceNewyear: num(form.priceNewyear),
      deposit: num(form.deposit),
      amenities,
      status: form.status as "active" | "hidden" | "sold",
    };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      mutation.mutate({ ...payload, id: cottage.id });
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    opts: { type?: string; placeholder?: string; suffix?: string } = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
        {label}
      </span>
      <div className="relative">
        <input
          type={opts.type ?? "text"}
          value={form[key]}
          onChange={set(key)}
          placeholder={opts.placeholder}
          min={opts.type === "number" ? 0 : undefined}
          className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#bb9c69]"
        />
        {opts.suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1f1f1f]/40">
            {opts.suffix}
          </span>
        )}
      </div>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto my-8 w-full max-w-3xl bg-[#f9f7f2] shadow-2xl"
      >
        {/* Шапка */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e2d5] bg-[#141414] px-6 py-4">
          <h2 className="font-display text-xl font-bold text-white">
            {isNew ? (
              <>
                Новый <span className="text-[#bb9c69]">объект</span>
              </>
            ) : (
              <>
                Редактирование <span className="text-[#bb9c69]">объекта</span>
              </>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center text-white/60 hover:text-white"
            aria-label="Закрыть"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {/* Основное */}
          <section>
            <h3 className="mb-4 font-display text-lg font-bold text-[#1f1f1f]">
              Основное
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
                  Название
                </span>
                <input
                  required
                  value={form.title}
                  onChange={set("title")}
                  className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bb9c69]"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
                    Адрес
                  </span>
                  <input
                    value={form.address}
                    onChange={set("address")}
                    className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bb9c69]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
                    Район
                  </span>
                  <input
                    value={form.district}
                    onChange={set("district")}
                    className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bb9c69]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
                    Статус
                  </span>
                  <select
                    value={form.status}
                    onChange={set("status")}
                    className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bb9c69]"
                  >
                    <option value="active">Активен</option>
                    <option value="hidden">Скрыт</option>
                    <option value="sold">Занят/продан</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          {/* Параметры */}
          <section>
            <h3 className="mb-4 font-display text-lg font-bold text-[#1f1f1f]">
              Параметры
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {field("Площадь", "totalArea", { type: "number", suffix: "м²" })}
              {field("Спален", "bedrooms", { type: "number" })}
              {field("Спальных мест", "beds", { type: "number" })}
            </div>
          </section>

          {/* Тарифы */}
          <section>
            <h3 className="mb-4 font-display text-lg font-bold text-[#1f1f1f]">
              Стоимость
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {field("Будний день", "priceWeekday", { type: "number", suffix: "₽" })}
              {field("Пятница", "priceFriday", { type: "number", suffix: "₽" })}
              {field("Суббота", "priceSaturday", { type: "number", suffix: "₽" })}
              {field("Полные выходные", "priceWeekend", { type: "number", suffix: "₽" })}
              {field("Новый год", "priceNewyear", { type: "number", suffix: "₽" })}
              {field("Залог", "deposit", { type: "number", suffix: "₽" })}
            </div>
            <div className="mt-4 lg:max-w-xs">
              {field("Базовая цена (в каталоге)", "price", {
                type: "number",
                suffix: "₽/сутки",
              })}
            </div>
          </section>

          {/* Фотографии */}
          <section>
            <h3 className="mb-1 font-display text-lg font-bold text-[#1f1f1f]">
              Фотографии
            </h3>
            {isNew ? (
              <p className="border border-dashed border-[#ddd5c3] bg-white p-6 text-center text-sm text-[#1f1f1f]/50">
                Сначала сохраните объект — после этого здесь можно будет
                загрузить фотографии
              </p>
            ) : (
              <>
                <p className="mb-4 text-xs text-[#1f1f1f]/50">
                  Первое фото становится обложкой. Стрелка вверх поднимает
                  фото в начало. Максимум 10 МБ на файл.
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="group relative aspect-[4/3] overflow-hidden bg-[#e8e2d5]"
                    >
                      <img
                        src={p.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          title="Сделать обложкой"
                          onClick={() => {
                            const ids = photos.map((x) => x.id);
                            const rest = ids.filter((x) => x !== p.id);
                            reorderMutation.mutate({
                              token,
                              cottageId: cottage.id,
                              orderedIds: [p.id, ...rest],
                            });
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-[#bb9c69]"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          title="Удалить"
                          onClick={() => {
                            if (confirm("Удалить это фото?")) {
                              deletePhotoMutation.mutate({
                                token,
                                photoId: p.id,
                              });
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {photos[0]?.id === p.id && (
                        <span className="absolute left-1.5 top-1.5 bg-[#bb9c69] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                          Обложка
                        </span>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading > 0}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border-2 border-dashed border-[#bb9c69]/50 text-[#bb9c69] transition-colors hover:border-[#bb9c69] hover:bg-[#bb9c69]/5 disabled:opacity-50"
                  >
                    <ImagePlus size={24} />
                    <span className="text-xs font-medium">
                      {uploading > 0
                        ? `Загрузка (${uploading})...`
                        : "Добавить фото"}
                    </span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </>
            )}
          </section>

          {/* Развлечения */}
          <section>
            <h3 className="mb-1 font-display text-lg font-bold text-[#1f1f1f]">
              Развлечения
            </h3>
            <p className="mb-4 text-xs text-[#1f1f1f]/50">
              Отметьте всё, что есть в доме — это влияет на фильтры каталога
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITY_OPTIONS.map((a) => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`border px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "border-[#bb9c69] bg-[#bb9c69] text-white"
                        : "border-[#ddd5c3] bg-white text-[#1f1f1f]/70 hover:border-[#bb9c69]"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Описание */}
          <section>
            <h3 className="mb-4 font-display text-lg font-bold text-[#1f1f1f]">
              Описание
            </h3>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={10}
              className="w-full border border-[#ddd5c3] bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#bb9c69]"
              placeholder="Подробное описание дома, условий и особенностей"
            />
          </section>
        </div>

        {/* Подвал */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#e8e2d5] bg-white px-6 py-4">
          {mutation.isError && (
            <span className="mr-auto text-sm text-red-500">
              Ошибка сохранения, попробуйте ещё раз
            </span>
          )}
          {saved && (
            <span className="mr-auto text-sm font-medium text-green-600">
              Сохранено!
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="border border-[#ddd5c3] px-6 py-3 text-sm text-[#1f1f1f]/60 transition-colors hover:border-[#bb9c69]"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-gold !px-8 !py-3 disabled:opacity-50"
          >
            {mutation.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
