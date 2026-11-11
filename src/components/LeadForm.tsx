import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { reachGoal } from "@/lib/metrika";

export function LeadForm({
  cottageId,
  cottageTitle,
  dark = false,
}: {
  cottageId?: number;
  cottageTitle?: string;
  dark?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = trpc.leads.create.useMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        name,
        phone,
        cottageId,
        message: cottageTitle
          ? `Интересует: ${cottageTitle}. ${message}`
          : message,
      },
      {
        onSuccess: () => {
          setSent(true);
          reachGoal("lead_submit", { cottageId });
        },
      },
    );
  };

  if (sent) {
    return (
      <div className={`py-8 text-center ${dark ? "text-white" : ""}`}>
        <div className="font-display text-2xl text-[#bb9c69]">
          Заявка отправлена!
        </div>
        <p className="mt-2 text-sm opacity-70">
          Мы свяжемся с вами в ближайшее время для подтверждения бронирования.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        className="w-full border border-[#bb9c69]/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-current/40 focus:border-[#bb9c69]"
      />
      <input
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон"
        type="tel"
        className="w-full border border-[#bb9c69]/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-current/40 focus:border-[#bb9c69]"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Комментарий (даты, количество гостей, пожелания)"
        rows={3}
        className="w-full border border-[#bb9c69]/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-current/40 focus:border-[#bb9c69]"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-gold w-full disabled:opacity-50"
      >
        {mutation.isPending ? "Отправка..." : "Отправить заявку"}
      </button>
    </form>
  );
}
