import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IMaskInput } from "react-imask";
import { trpc } from "@/providers/trpc";
import { reachGoal } from "@/lib/metrika";

// Форма — RHF + Zod v4, honeypot, маска телефона.
// Даты приходят как yyyy-mm-dd из input[type=date]; в мутацию уходят как UTC-день
// (T00:00:00Z) — это соглашение бэкенда: [checkIn, checkOut), день выезда свободен.

function toInputDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputDate(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

// Генерация примера капчи вынесена из компонента: react-hooks/purity
// разрешает нечистые вызовы в ленивом инициализаторе useState и в обработчиках,
// но ломается на вспомогательных функциях внутри компонента.
function randomCaptchaPair(): [number, number] {
  return [
    1 + Math.floor(Math.random() * 9),
    1 + Math.floor(Math.random() * 9),
  ];
}

interface LeadFormProps {
  cottageId?: number;
  cottageTitle?: string;
  dark?: boolean;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}

export function LeadForm({
  cottageId,
  cottageTitle,
  dark = false,
  initialCheckIn,
  initialCheckOut,
}: LeadFormProps) {
  // Простая математическая капча: два числа, сумма проверяется refine'ом.
  // Это не reCAPTCHA — лёгкий барьер для ботов вместе с honeypot и rate-limit.
  const [captchaPair, setCaptchaPair] =
    useState<[number, number]>(randomCaptchaPair);
  const [sent, setSent] = useState(false);

  const refreshCaptcha = () => setCaptchaPair(randomCaptchaPair());

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, "Укажите имя"),
          phone: z.string().trim().min(18, "Введите телефон полностью"),
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
          guests: z
            .string()
            .refine(
              (v) => {
                if (v === "") return true;
                const n = Number(v);
                return Number.isInteger(n) && n >= 1 && n <= 100;
              },
              "Количество гостей: целое число от 1 до 100",
            ),
          message: z.string().trim().max(2000).optional(),
          // Honeypot: скрыто от людей, боты заполняют — заявку выкидываем молча
          website: z.string().optional(),
          captcha: z.string().superRefine((v, ctx) => {
            if (v === "") {
              ctx.addIssue({ code: "custom", message: "Решите пример" });
            } else if (Number(v) !== captchaPair[0] + captchaPair[1]) {
              ctx.addIssue({
                code: "custom",
                message: "Неверный ответ, попробуйте ещё раз",
              });
            }
          }),
        })
        .refine(
          (v) => !v.checkIn || !v.checkOut || v.checkOut > v.checkIn,
          { message: "Выезд должен быть позже заезда", path: ["checkOut"] },
        ),
    [captchaPair],
  );

  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      checkIn: initialCheckIn ? toInputDate(initialCheckIn) : "",
      checkOut: initialCheckOut ? toInputDate(initialCheckOut) : "",
      guests: "",
      message: "",
      website: "",
      captcha: "",
    },
  });

  const mutation = trpc.leads.create.useMutation();

  const inputCls = `w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-current/40 ${
    dark
      ? "border-white/25 text-white focus:border-[#45c1af]"
      : "border-[#1f7567]/40 focus:border-[#1f7567]"
  }`;

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      {
        name: values.name,
        phone: values.phone,
        cottageId,
        checkIn: values.checkIn ? fromInputDate(values.checkIn) : undefined,
        checkOut: values.checkOut ? fromInputDate(values.checkOut) : undefined,
        guests: values.guests ? Number(values.guests) : undefined,
        message: values.message || undefined,
        website: values.website || undefined,
      },
      {
        onSuccess: () => {
          reset();
          refreshCaptcha();
          reachGoal("lead_submit", { cottageId });
          setSent(true);
        },
        onError: refreshCaptcha,
      },
    );
  });

  if (sent) {
    return (
      <div className={`py-8 text-center ${dark ? "text-white" : ""}`}>
        <div className={`font-display text-2xl ${dark ? "text-[#45c1af]" : "text-[#1f7567]"}`}>
          Заявка отправлена!
        </div>
        <p className="mt-2 text-sm opacity-70">
          Перезвоним в течение 15 минут для подтверждения бронирования.
        </p>
      </div>
    );
  }

  const err = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <input
          {...register("name")}
          placeholder="Ваше имя"
          autoComplete="name"
          className={inputCls}
        />
        {err(errors.name?.message)}
      </div>

      <div>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <IMaskInput
              inputRef={field.ref}
              name={field.name}
              value={field.value}
              // onChange из field нельзя: React глотает синтетический input-event,
              // потому что imask сам пишет el.value до того, как событие
              // всплывёт к React. onAccept — каноничная точка интеграции.
              onAccept={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              mask="+{7} (000) 000-00-00"
              lazy={false}
              placeholder="+7 (___) ___-__-__"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              className={inputCls}
            />
          )}
        />
        {err(errors.phone?.message)}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            {...register("checkIn")}
            type="date"
            aria-label="Дата заезда"
            className={inputCls}
          />
          {err(errors.checkIn?.message)}
        </div>
        <div>
          <input
            {...register("checkOut")}
            type="date"
            aria-label="Дата выезда"
            className={inputCls}
          />
          {err(errors.checkOut?.message)}
        </div>
      </div>

      <div>
        <input
          {...register("guests")}
          type="number"
          min={1}
          max={100}
          placeholder="Количество гостей"
          className={inputCls}
        />
        {err(errors.guests?.message)}
      </div>

      <div>
        <textarea
          {...register("message")}
          placeholder="Комментарий (пожелания, время заезда)"
          rows={3}
          className={inputCls}
        />
        {err(errors.message?.message)}
      </div>

      {/* Honeypot: не заполняйте (бот-ловушка) */}
      <input
        {...register("website")}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div>
        <label className={`text-sm ${dark ? "text-white/60" : "text-[#1f1f1f]/60"}`}>
          Проверка: сколько будет {captchaPair[0]} + {captchaPair[1]}?
        </label>
        <input
          {...register("captcha")}
          type="number"
          inputMode="numeric"
          placeholder="Ответ"
          className={`mt-1 ${inputCls}`}
        />
        {err(errors.captcha?.message)}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-brand w-full disabled:opacity-50"
      >
        {mutation.isPending ? "Отправка..." : "Отправить заявку"}
      </button>
      {cottageTitle ? (
        <p className={`text-xs ${dark ? "text-white/40" : "text-[#1f1f1f]/40"}`}>
          Объект: {cottageTitle}
        </p>
      ) : null}
    </form>
  );
}
