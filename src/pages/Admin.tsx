import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/components/CottageCard";
import { CottageEditForm } from "@/components/CottageEditForm";

const TOKEN_KEY = "gm_admin_token";

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"cottages" | "leads">("cottages");
  const [loginError, setLoginError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const login = trpc.admin.login.useMutation();
  const utils = trpc.useUtils();

  const { data: items } = trpc.admin.listAll.useQuery(
    { token, limit: 300 },
    { enabled: !!token },
  );
  const { data: leads } = trpc.admin.leadsList.useQuery(
    { token },
    { enabled: !!token && tab === "leads" },
  );

  const updateStatus = trpc.admin.updateStatus.useMutation({
    onSuccess: () => utils.admin.listAll.invalidate(),
  });
  const updatePrice = trpc.admin.updatePrice.useMutation({
    onSuccess: () => utils.admin.listAll.invalidate(),
  });

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { token: password },
      {
        onSuccess: (res) => {
          sessionStorage.setItem(TOKEN_KEY, res.token);
          setToken(res.token);
          setLoginError("");
        },
        onError: () => setLoginError("Неверный пароль"),
      },
    );
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] px-4">
        <form
          onSubmit={submitLogin}
          className="w-full max-w-sm bg-[#1f1f1f] p-8 text-white"
        >
          <h1 className="font-display text-2xl font-bold">
            Панель <span className="text-[#bb9c69]">управления</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Введите пароль администратора
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="mt-6 w-full border border-white/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#bb9c69]"
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-400">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="btn-gold mt-4 w-full"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f2] pt-20">
      <div className="container-site py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-[#1f1f1f]">
            Панель управления
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {tab === "cottages" && (
              <button
                onClick={() => setCreating(true)}
                className="bg-[#bb9c69] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a9874d]"
              >
                + Добавить объект
              </button>
            )}
            {(
              [
                ["cottages", `Объекты (${items?.length ?? 0})`],
                ["leads", `Заявки (${leads?.length ?? 0})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm transition-colors ${
                  tab === key
                    ? "bg-[#bb9c69] text-white"
                    : "border border-[#ddd5c3] hover:border-[#bb9c69]"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                sessionStorage.removeItem(TOKEN_KEY);
                setToken("");
              }}
              className="border border-[#ddd5c3] px-4 py-2 text-sm text-[#1f1f1f]/60 hover:border-red-400 hover:text-red-500"
            >
              Выйти
            </button>
          </div>
        </div>

        {tab === "cottages" && (
          <div className="mt-6 overflow-x-auto bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#e8e2d5] text-left text-xs uppercase tracking-wider text-[#1f1f1f]/50">
                  <th className="p-4">Объект</th>
                  <th className="p-4">Район</th>
                  <th className="p-4">Цена / сутки</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#f0ece2] hover:bg-[#f9f7f2]"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.photos[0]?.url ?? "/placeholder.jpg"}
                          alt=""
                          className="h-12 w-16 object-cover"
                        />
                        <div>
                          <a
                            href={`/cottage/${c.id}`}
                            target="_blank"
                            className="font-medium text-[#1f1f1f] hover:text-[#bb9c69]"
                          >
                            {c.title}
                          </a>
                          <div className="text-xs text-[#1f1f1f]/40">
                            ID {c.externalId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#1f1f1f]/60">{c.district}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        defaultValue={c.price ?? 0}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== c.price && v > 0) {
                            updatePrice.mutate({ token, id: c.id, price: v });
                          }
                        }}
                        className="w-28 border border-transparent bg-transparent px-2 py-1 hover:border-[#ddd5c3] focus:border-[#bb9c69] focus:outline-none"
                      />
                      <span className="text-xs text-[#1f1f1f]/40">
                        ({formatPrice(c.price)})
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={c.status}
                        onChange={(e) =>
                          updateStatus.mutate({
                            token,
                            id: c.id,
                            status: e.target.value as "active" | "hidden" | "sold",
                          })
                        }
                        className={`border px-2 py-1 text-xs ${
                          c.status === "active"
                            ? "border-green-300 text-green-700"
                            : c.status === "hidden"
                              ? "border-gray-300 text-gray-500"
                              : "border-orange-300 text-orange-600"
                        }`}
                      >
                        <option value="active">Активен</option>
                        <option value="hidden">Скрыт</option>
                        <option value="sold">Занят/продан</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingId(c.id)}
                          className="bg-[#bb9c69] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#a9874d]"
                        >
                          Изменить
                        </button>
                        <a
                          href={`/cottage/${c.id}`}
                          target="_blank"
                          className="text-xs text-[#bb9c69] hover:underline"
                        >
                          Открыть →
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "leads" && (
          <div className="mt-6 overflow-x-auto bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-[#e8e2d5] text-left text-xs uppercase tracking-wider text-[#1f1f1f]/50">
                  <th className="p-4">Дата</th>
                  <th className="p-4">Имя</th>
                  <th className="p-4">Телефон</th>
                  <th className="p-4">Сообщение</th>
                </tr>
              </thead>
              <tbody>
                {leads?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#1f1f1f]/40">
                      Заявок пока нет
                    </td>
                  </tr>
                )}
                {leads?.map((l) => (
                  <tr key={l.id} className="border-b border-[#f0ece2]">
                    <td className="p-4 text-[#1f1f1f]/50">
                      {new Date(l.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="p-4 font-medium">{l.name}</td>
                    <td className="p-4">
                      <a
                        href={`tel:${l.phone}`}
                        className="text-[#bb9c69] hover:underline"
                      >
                        {l.phone}
                      </a>
                    </td>
                    <td className="max-w-xs p-4 text-[#1f1f1f]/60">
                      {l.message ?? "—"}
                      {l.cottageId && (
                        <a
                          href={`/cottage/${l.cottageId}`}
                          target="_blank"
                          className="ml-2 text-xs text-[#bb9c69] hover:underline"
                        >
                          объект →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId != null && items && (
        <CottageEditForm
          cottage={items.find((c) => c.id === editingId)!}
          token={token}
          onClose={() => setEditingId(null)}
        />
      )}

      {creating && (
        <CottageEditForm
          cottage={null}
          token={token}
          onClose={() => setCreating(false)}
          onCreated={(id) => setEditingId(id)}
        />
      )}
    </div>
  );
}
