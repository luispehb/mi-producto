import type { Metadata } from "next";
import { FONTS } from "@/lib/fonts";
import "./admin.css";

export const metadata: Metadata = {
  title: "Hap — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={FONTS} precedence="default" />
      {children}
    </>
  );
}
