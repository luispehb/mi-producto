import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";
import "./admin.css";

export const metadata: Metadata = {
  title: "Hap — Admin",
  robots: { index: false, follow: false },
};

// Mismas fuentes que el HTML original (Turbopack descarta los @import remotos en CSS)
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";

export default function AdminPage() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <AdminPanel />
    </>
  );
}
