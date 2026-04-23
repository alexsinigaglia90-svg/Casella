// apps/web/app/head-theme-script.tsx
// NOTE: rendered server-side into <head>; body is an inline script that runs before React hydrates.
// It reads the theme cookie and applies `dark` class on <html> if needed. Prevents FOUT.

import { THEME_COOKIE } from "@/lib/theme-cookie";

export function HeadThemeScript() {
  const code = `
    (function() {
      try {
        var c = document.cookie.split('; ').find(r => r.startsWith('${THEME_COOKIE}='));
        var t = c ? decodeURIComponent(c.split('=')[1]) : 'system';
        var resolved = t === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : t;
        if (resolved === 'dark') document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', resolved);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
