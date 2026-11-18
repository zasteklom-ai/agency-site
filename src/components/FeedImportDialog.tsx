import { useState } from "react";
import { X, FileUp, Loader2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import { trpc } from "@/providers/trpc";

type FeedPlan = inferRouterOutputs<AppRouter>["feed"]["parse"];
type FeedError = FeedPlan["errors"][number];
type SourcePayload = { xmlBase64: string } | { feedUrl: string };

interface ImportSummary {
  created: number;
  updated: number;
  failed: FeedError[];
  warnings: { externalId: string; message: string }[];
  photos: { downloaded: number; kept: number; removed: number; failed: number };
}

const BATCH_SIZE = 10;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      resolve(url.slice(url.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function FeedImportDialog({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"select" | "parsed" | "importing" | "done">("select");
  const [source, setSource] = useState<"file" | "url">("file");
  const [fileName, setFileName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [plan, setPlan] = useState<(FeedPlan & { source: SourcePayload }) | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");

  const parseFeed = trpc.feed.parse.useMutation();
  const importFeed = trpc.feed.import.useMutation();
  const utils = trpc.useUtils();

  const reset = () => {
    setPhase("select");
    setPlan(null);
    setFileName("");
    setError("");
  };

  const handleFile = async (file: File) => {
    setError("");
    if (file.size > 18_000_000) {
      setError("Файл больше 18 МБ — разбейте фид на части");
      return;
    }
    setFileName(file.name);
    try {
      const xmlBase64 = await fileToBase64(file);
      const p = await parseFeed.mutateAsync({ xmlBase64 });
      setPlan({ ...p, source: { xmlBase64 } });
      setPhase("parsed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось разобрать файл");
    }
  };

  const handleUrl = async () => {
    setError("");
    const url = feedUrl.trim();
    if (!url) {
      setError("Вставьте ссылку на фид");
      return;
    }
    try {
      const p = await parseFeed.mutateAsync({ feedUrl: url });
      setPlan({ ...p, source: { feedUrl: url } });
      setPhase("parsed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось разобрать фид");
    }
  };

  const startImport = async () => {
    if (!plan) return;
    const ids = plan.items.map((i) => i.externalId);
    const agg: ImportSummary = {
      created: 0,
      updated: 0,
      failed: [...plan.errors],
      warnings: [],
      photos: { downloaded: 0, kept: 0, removed: 0, failed: 0 },
    };
    setPhase("importing");
    setProgress({ done: 0, total: ids.length });

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      try {
        const r = await importFeed.mutateAsync({
          ...plan.source,
          onlyExternalIds: chunk,
        });
        agg.created += r.created;
        agg.updated += r.updated;
        agg.failed.push(...r.failed);
        agg.warnings.push(...r.warnings);
        agg.photos.downloaded += r.photos.downloaded;
        agg.photos.kept += r.photos.kept;
        agg.photos.removed += r.photos.removed;
        agg.photos.failed += r.photos.failed;
      } catch (e) {
        const message = e instanceof Error ? e.message : "ошибка импорта";
        for (const externalId of chunk) {
          agg.failed.push({ index: -1, externalId, message });
        }
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length });
    }

    setSummary(agg);
    setPhase("done");
    utils.admin.listAll.invalidate();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto my-8 w-full max-w-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#1f1f1f]">
            Импорт из XML-фида
          </h2>
          <button
            onClick={onClose}
            className="text-[#1f1f1f]/40 hover:text-[#1f1f1f]"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#1f1f1f]/50">
          Формат Яндекс.Недвижимости (realty-feed), файлом или ссылкой.
          Объекты связываются по internal-id, новые публикуются сразу. Фото
          скачиваются на наш хостинг.
        </p>

        {error && (
          <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {phase === "select" && (
          <div className="mt-6">
            <div className="flex border border-[#d8dcd9] text-sm">
              {(
                [
                  ["file", "Файл с компьютера"],
                  ["url", "Ссылка на фид"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSource(key);
                    setError("");
                  }}
                  className={`flex-1 px-4 py-2 transition-colors ${
                    source === key
                      ? "bg-[#1f7567] font-semibold text-white"
                      : "text-[#1f1f1f]/60 hover:text-[#1f7567]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {source === "file" ? (
              <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed border-[#d8dcd9] px-6 py-12 text-center transition-colors hover:border-[#1f7567]">
                <FileUp size={28} className="text-[#1f7567]" />
                <span className="text-sm text-[#1f1f1f]/70">
                  Выберите XML-фид на компьютере
                </span>
                <span className="text-xs text-[#1f1f1f]/40">до 18 МБ</span>
                <input
                  type="file"
                  accept=".xml,text/xml"
                  className="hidden"
                  disabled={parseFeed.isPending}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.target.value = "";
                  }}
                />
                {parseFeed.isPending && (
                  <span className="flex items-center gap-2 text-sm text-[#1f7567]">
                    <Loader2 size={16} className="animate-spin" /> Разбираю файл…
                  </span>
                )}
              </label>
            ) : (
              <div className="mt-4">
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleUrl();
                    }
                  }}
                  placeholder="https://crm.example.ru/export/feed.xml"
                  className="w-full border border-[#d8dcd9] px-4 py-3 text-sm outline-none focus:border-[#1f7567]"
                />
                <button
                  onClick={() => void handleUrl()}
                  disabled={parseFeed.isPending || !feedUrl.trim()}
                  className="btn-brand mt-3 w-full disabled:opacity-40"
                >
                  {parseFeed.isPending ? "Скачиваю и разбираю…" : "Разобрать фид"}
                </button>
                {parseFeed.isPending && (
                  <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#1f7567]">
                    <Loader2 size={14} className="animate-spin" /> Скачивание
                    может занять до 30 секунд
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {phase === "parsed" && plan && (
          <div className="mt-6">
            <p className="text-sm text-[#1f1f1f]/60">
              {plan.source && "xmlBase64" in plan.source ? "Файл" : "Ссылка"}:{" "}
              <span className="font-medium break-all">
                {"xmlBase64" in plan.source ? fileName : plan.source.feedUrl}
              </span>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Всего объектов", plan.totalOffers],
                  ["Новых", plan.toCreate],
                  ["Обновится", plan.toUpdate],
                  ["Фото в фиде", plan.photos],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="bg-[#f2f6f4] p-3 text-center">
                  <div className="font-display text-2xl font-bold text-[#1f7567]">
                    {value}
                  </div>
                  <div className="text-xs text-[#1f1f1f]/50">{label}</div>
                </div>
              ))}
            </div>

            {plan.errors.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-semibold text-orange-700">
                  Пропущено при разборе: {plan.errors.length}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-orange-700/80">
                  {plan.errors.map((e, i) => (
                    <li key={i}>
                      offer #{e.index + 1}
                      {e.externalId ? ` (${e.externalId})` : ""}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={reset}
                className="border border-[#d8dcd9] px-4 py-2 text-sm text-[#1f1f1f]/70 hover:border-[#1f7567]"
              >
                Другой фид
              </button>
              <button
                onClick={() => void startImport()}
                disabled={plan.items.length === 0}
                className="bg-[#1f7567] px-4 py-2 text-sm font-semibold text-white hover:bg-[#185f54] disabled:opacity-40"
              >
                Импортировать {plan.items.length > 0 ? `(${plan.items.length})` : ""}
              </button>
            </div>
          </div>
        )}

        {phase === "importing" && (
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#1f7567]">
                <Loader2 size={16} className="animate-spin" /> Импортирую…
              </span>
              <span className="text-[#1f1f1f]/50">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-[#eef1ef]">
              <div
                className="h-full bg-[#1f7567] transition-all"
                style={{
                  width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%",
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[#1f1f1f]/40">
              Скачивание фото может занять несколько минут — не закрывайте
              страницу.
            </p>
          </div>
        )}

        {phase === "done" && summary && (
          <div className="mt-6">
            <p className="text-sm font-medium text-[#1f1f1f]">Импорт завершён</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Создано", summary.created],
                  ["Обновлено", summary.updated],
                  ["Ошибок", summary.failed.length],
                  ["Фото загружено", summary.photos.downloaded],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="bg-[#f2f6f4] p-3 text-center">
                  <div
                    className={`font-display text-2xl font-bold ${
                      label === "Ошибок" && value > 0
                        ? "text-red-500"
                        : "text-[#1f7567]"
                    }`}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-[#1f1f1f]/50">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#1f1f1f]/50">
              Фото: скачано {summary.photos.downloaded}, оставлено{" "}
              {summary.photos.kept}, удалено {summary.photos.removed}, не
              скачано {summary.photos.failed}.
            </p>

            {(summary.failed.length > 0 || summary.warnings.length > 0) && (
              <div className="mt-4 max-h-48 space-y-3 overflow-y-auto">
                {summary.failed.length > 0 && (
                  <div className="border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-700">
                      Ошибки: {summary.failed.length}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-red-700/80">
                      {summary.failed.slice(0, 50).map((e, i) => (
                        <li key={i}>
                          {e.externalId ?? `offer #${e.index + 1}`}: {e.message}
                        </li>
                      ))}
                      {summary.failed.length > 50 && (
                        <li>…и ещё {summary.failed.length - 50}</li>
                      )}
                    </ul>
                  </div>
                )}
                {summary.warnings.length > 0 && (
                  <div className="border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold text-orange-700">
                      Предупреждения: {summary.warnings.length}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-orange-700/80">
                      {summary.warnings.slice(0, 50).map((w, i) => (
                        <li key={i}>
                          {w.externalId}: {w.message}
                        </li>
                      ))}
                      {summary.warnings.length > 50 && (
                        <li>…и ещё {summary.warnings.length - 50}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-[#1f7567] px-4 py-2 text-sm font-semibold text-white hover:bg-[#185f54]"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
