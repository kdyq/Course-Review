import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { SITE_DESCRIPTION, SITE_NAME, THEME_STORAGE_KEY } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · 匿名课程评价`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

const themeScript = `(function(){try{var key=${JSON.stringify(THEME_STORAGE_KEY)};var value=window.localStorage.getItem(key);if(value==="light"||value==="dark"){document.documentElement.dataset.theme=value;}}catch(error){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 主题脚本为常量，需要在首次绘制前执行 */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main">
            跳到主要内容
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
