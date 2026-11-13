# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

## iCal-синхронизация с Авито/ЦИАН и уведомления в Telegram

### Telegram-заявки

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите токен.
2. Узнайте числовой chat ID через [@userinfobot](https://t.me/userinfobot)
   (для группы добавьте бота в группу и возьмите ID вида `-100...`).
3. Заполните в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_CHAT_ID=...
   SITE_URL=https://ваш-домен.ru
   ADMIN_PROPERTY_URL_TEMPLATE=https://ваш-домен.ru/admin/cottages/{id}/calendar
   ```
   Заявки с формы (с защитой: honeypot + математическая капча + 10 заявок/10 мин с IP)
   сохраняются в таблицу `leads` и дублируются сообщением в чат.

### Экспорт календаря (наши брони → Авито/ЦИАН)

1. Админка → объект → «Календарь» → блок «Синхронизация iCal» показывает
   секретную ссылку вида `/api/ical/export/:id?token=...`.
2. Вставьте эту ссылку в поле импорта календаря в кабинете Авито/ЦИАН.
   Площадки сами забирают `.ics` (METHOD:PUBLISH, одно all-day событие на бронь;
   день выезда — свободен).
3. «Перегенерировать ссылку» отзывает старый токен, если он утёк.

### Импорт календаря (брони Авито/ЦИАН → у нас)

1. В кабинете Авито/ЦИАН скопируйте ссылку на экспорт календаря объекта (ical).
2. Вставьте её в админке в поле «URL импорта Авито» / «URL импорта ЦИАН».
3. Импорт запускается каждые 15 минут (node-cron в процессе сервера) или
   кнопкой «Синхронизировать сейчас».

Правила слияния: совпадение по UID события; исчезнувшие события переводятся
в статус `CANCELLED` (физически ничего не удаляется). Ручные брони
(`source=MANUAL`) никогда не перезаписываются импортом — при конфликте дат
внешнее событие пропускается с записью в лог. Управлять внешними бронями
вручную нельзя (read-only) — только на стороне площадки или отменой записи.

### После изменения схемы БД

```bash
npm run db:generate   # сгенерировать миграцию
npm run db:migrate    # применить (db:push — только локальная песочница)
```
