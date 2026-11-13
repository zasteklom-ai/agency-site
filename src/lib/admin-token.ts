// Ключ sessionStorage с админским токеном. Отдельный модуль без компонентов,
// чтобы providers/trpc.tsx не ловил react-refresh/only-export-components.
export const ADMIN_TOKEN_KEY = "gm_admin_token";
