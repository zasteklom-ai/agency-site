import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Clapperboard, Pencil, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ADMIN_TOKEN_KEY } from "@/lib/admin-token";
import {
  partnerContentSchema,
  emptyPartnerContent,
  type PartnerInput,
} from "@contracts/partners";

type PartnerRow = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  excerpt: string;
  location: string;
  heroImage: string;
  heroAlt: string;
  cardImage: string;
  cardAlt: string;
  metaTitle: string;
  metaDescription: string;
  territoryPlan: string;
  territoryPlanAlt: string;
  videoUrl: string | null;
  content: PartnerInput["content"];
  sortOrder: number;
  isPublished: boolean;
};

type FormState = {
  slug: string;
  name: string;
  tagline: string;
  location: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  videoUrl: string;
  heroImage: string;
  heroAlt: string;
  cardImage: string;
  cardAlt: string;
  territoryPlan: string;
  territoryPlanAlt: string;
  sortOrder: string;
  isPublished: boolean;
  contentJson: string;
};

function toFormState(p: PartnerRow | null): FormState {
  if (!p) {
    return {
      slug: "",
      name: "",
      tagline: "",
      location: "",
      excerpt: "",
      metaTitle: "",
      metaDescription: "",
      videoUrl: "",
      heroImage: "",
      heroAlt: "",
      cardImage: "",
      cardAlt: "",
      territoryPlan: "",
      territoryPlanAlt: "",
      sortOrder: "0",
      isPublished: true,
      contentJson: JSON.stringify(emptyPartnerContent(), null, 2),
    };
  }
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    location: p.location,
    excerpt: p.excerpt,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    videoUrl: p.videoUrl ?? "",
    heroImage: p.heroImage,
    heroAlt: p.heroAlt,
    cardImage: p.cardImage,
    cardAlt: p.cardAlt,
    territoryPlan: p.territoryPlan,
    territoryPlanAlt: p.territoryPlanAlt,
    sortOrder: String(p.sortOrder),
    isPublished: p.isPublished,
    contentJson: JSON.stringify(p.content, null, 2),
  };
}

const INPUT =
  "w-full border border-[#d8dcd9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f7567]";

function PartnerForm({
  partner,
  onClose,
}: {
  partner: PartnerRow | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(partner));
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const create = trpc.partners.create.useMutation({
    onSuccess: () => {
      utils.partners.adminList.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.partners.update.useMutation({
    onSuccess: () => {
      utils.partners.adminList.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let content: PartnerInput["content"];
    try {
      content = JSON.parse(form.contentJson);
    } catch {
      setError("Контент — не валидный JSON (проверьте запятые и кавычки)");
      return;
    }
    const checked = partnerContentSchema.safeParse(content);
    if (!checked.success) {
      const issue = checked.error.issues[0];
      setError(
        `Контент: ${issue.path.join(".") || "корень"} — ${issue.message}`,
      );
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Порядок сортировки — целое число от 0");
      return;
    }

    const input: PartnerInput = {
      slug: form.slug,
      name: form.name,
      tagline: form.tagline,
      location: form.location,
      excerpt: form.excerpt,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      videoUrl: form.videoUrl,
      heroImage: form.heroImage,
      heroAlt: form.heroAlt,
      cardImage: form.cardImage,
      cardAlt: form.cardAlt,
      territoryPlan: form.territoryPlan,
      territoryPlanAlt: form.territoryPlanAlt,
      sortOrder,
      isPublished: form.isPublished,
      content: checked.data,
    };

    if (partner) {
      update.mutate({ id: partner.id, ...input });
    } else {
      create.mutate(input);
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="mx-auto my-8 max-w-3xl bg-white p-8 shadow-xl"
      >
        <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
          {partner ? `Редактирование: ${partner.name}` : "Новая площадка"}
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Название *
            </span>
            <input
              required
              value={form.name}
              onChange={set("name")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Slug * (латиница и дефисы)
            </span>
            <input
              required
              value={form.slug}
              onChange={set("slug")}
              placeholder="u-ozera"
              className={INPUT}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Теглайн
            </span>
            <input
              value={form.tagline}
              onChange={set("tagline")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Локация
            </span>
            <input
              value={form.location}
              onChange={set("location")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Порядок сортировки
            </span>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={set("sortOrder")}
              className={INPUT}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Краткое описание (для карточки)
            </span>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={set("excerpt")}
              className={INPUT}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              <Clapperboard size={14} /> Ссылка на видео (Rutube или VK Видео)
            </span>
            <input
              value={form.videoUrl}
              onChange={set("videoUrl")}
              placeholder="https://rutube.ru/video/… или https://vkvideo.ru/video-…_…"
              className={INPUT}
            />
            <span className="mt-1 block text-xs text-[#1f1f1f]/40">
              Плеер появится на странице площадки в блоке «Видео о площадке».
              Оставьте пустым, чтобы скрыть блок.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Hero-фото (путь)
            </span>
            <input
              value={form.heroImage}
              onChange={set("heroImage")}
              placeholder="/partners/u-ozera/…"
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Alt hero-фото
            </span>
            <input value={form.heroAlt} onChange={set("heroAlt")} className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Фото карточки (путь)
            </span>
            <input
              value={form.cardImage}
              onChange={set("cardImage")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Alt фото карточки
            </span>
            <input value={form.cardAlt} onChange={set("cardAlt")} className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              План территории (путь)
            </span>
            <input
              value={form.territoryPlan}
              onChange={set("territoryPlan")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Alt плана территории
            </span>
            <input
              value={form.territoryPlanAlt}
              onChange={set("territoryPlanAlt")}
              className={INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Title (SEO)
            </span>
            <input
              value={form.metaTitle}
              onChange={set("metaTitle")}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
              Description (SEO)
            </span>
            <input
              value={form.metaDescription}
              onChange={set("metaDescription")}
              className={INPUT}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-[#1f1f1f]/50">
            Контентные разделы (JSON): цифры, о площадке, залы, проживание,
            мероприятия, услуги
          </span>
          <textarea
            rows={14}
            value={form.contentJson}
            onChange={set("contentJson")}
            spellCheck={false}
            className={`${INPUT} font-mono text-xs`}
          />
        </label>

        <label className="mt-4 flex items-center gap-3 text-sm text-[#1f1f1f]/80">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPublished: e.target.checked }))
            }
            className="h-4 w-4 accent-[#1f7567]"
          />
          Опубликована (видна на сайте)
        </label>

        {error && (
          <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="bg-[#1f7567] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#185f54] disabled:opacity-50"
          >
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-[#d8dcd9] px-6 py-3 text-sm text-[#1f1f1f]/60 transition-colors hover:border-[#1f7567]"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPartners() {
  const [token] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: items, isLoading } = trpc.partners.adminList.useQuery(
    undefined,
    { enabled: !!token },
  );
  const utils = trpc.useUtils();
  const setPublished = trpc.partners.setPublished.useMutation({
    onSuccess: () => utils.partners.adminList.invalidate(),
  });
  const remove = trpc.partners.delete.useMutation({
    onSuccess: () => utils.partners.adminList.invalidate(),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f6f4] px-4 pt-20">
        <div className="bg-white p-10 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#1f1f1f]">
            Нужен вход в панель
          </h1>
          <p className="mt-2 text-sm text-[#1f1f1f]/50">
            Войдите в панель управления, затем вернитесь сюда.
          </p>
          <Link to="/admin" className="btn-brand mt-6 inline-flex">
            Перейти ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f6f4] pt-20">
      <div className="container-site py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-sm text-[#1f1f1f]/50 transition-colors hover:text-[#1f7567]"
            >
              <ChevronLeft size={16} /> Панель
            </Link>
            <h1 className="font-display text-2xl font-bold text-[#1f1f1f]">
              Партнёрские площадки
            </h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[#1f7567] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#185f54]"
          >
            <Plus size={16} /> Добавить площадку
          </button>
        </div>

        <div className="mt-6 overflow-x-auto bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#e3e7e4] text-left text-xs uppercase tracking-wider text-[#1f1f1f]/50">
                <th className="p-4">Площадка</th>
                <th className="p-4">Видео</th>
                <th className="p-4">Порядок</th>
                <th className="p-4">Публикация</th>
                <th className="p-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#1f1f1f]/40">
                    Загрузка…
                  </td>
                </tr>
              )}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#1f1f1f]/40">
                    Площадок пока нет
                  </td>
                </tr>
              )}
              {items?.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#eef1ef] hover:bg-[#f2f6f4]"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.cardImage || "/placeholder.jpg"}
                        alt=""
                        className="h-12 w-16 object-cover"
                      />
                      <div>
                        <a
                          href={`/partners/${p.slug}`}
                          target="_blank"
                          className="font-medium text-[#1f1f1f] hover:text-[#1f7567]"
                        >
                          {p.name}
                        </a>
                        <div className="text-xs text-[#1f1f1f]/40">
                          /partners/{p.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {p.videoUrl ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#1f7567]">
                        <Clapperboard size={14} /> есть
                      </span>
                    ) : (
                      <span className="text-xs text-[#1f1f1f]/30">—</span>
                    )}
                  </td>
                  <td className="p-4 text-[#1f1f1f]/60">{p.sortOrder}</td>
                  <td className="p-4">
                    <button
                      onClick={() =>
                        setPublished.mutate({ id: p.id, isPublished: !p.isPublished })
                      }
                      className={`border px-3 py-1.5 text-xs transition-colors ${
                        p.isPublished
                          ? "border-green-300 text-green-700 hover:border-green-500"
                          : "border-gray-300 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {p.isPublished ? "Опубликована" : "Скрыта"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditing(p)}
                        className="flex items-center gap-1.5 bg-[#1f7567] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#185f54]"
                      >
                        <Pencil size={12} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить площадку «${p.name}»?`)) {
                            remove.mutate({ id: p.id });
                          }
                        }}
                        className="flex items-center gap-1.5 border border-red-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:border-red-400"
                      >
                        <Trash2 size={12} /> Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || creating) && (
        <PartnerForm
          partner={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
