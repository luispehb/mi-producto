import type { Metadata } from "next";
import { FONTS } from "@/lib/fonts";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Hap",
  robots: { index: false, follow: false },
};

// Login, registro y las páginas de la app usan los mismos estilos que el panel
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={FONTS} precedence="default" />
      {children}
    </>
  );
}
