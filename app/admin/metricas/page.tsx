import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";
import MetricsDashboard from "@/components/MetricsDashboard";

export const metadata: Metadata = { title: "Hap — Métricas" };

export default function MetricsPage() {
  return <AdminGate next="/admin/metricas">{email => <MetricsDashboard email={email} />}</AdminGate>;
}
