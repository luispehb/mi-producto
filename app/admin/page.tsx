import AdminGate from "@/components/AdminGate";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return <AdminGate next="/admin">{email => <AdminPanel email={email} />}</AdminGate>;
}
