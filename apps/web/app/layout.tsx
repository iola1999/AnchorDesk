import type { ReactNode } from "react";

import { AppSessionProvider } from "@/components/shared/session-provider";
import { textSelectionStyles } from "@/lib/ui";

import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={textSelectionStyles.chrome}>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
