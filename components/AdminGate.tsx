import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

// Las páginas del panel solo se muestran a los emails de ADMIN_EMAILS.
// Las rutas /api/admin/* vuelven a chequear lo mismo antes de dar datos.
export default async function AdminGate({ next, children }: { next: string; children: (email: string) => React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  if (!isAdmin(user)) {
    return (
      <main>
        <div className="login">
          <span className="eyebrow">Hap · Admin</span>
          <h1>Sin acceso</h1>
          <p className="who">{user.email}</p>
          <p className="empty">Esta cuenta no tiene acceso.</p>
          <Link className="btn btn-primary" href="/planes">Ir a mis planes</Link>
          <LogoutButton />
        </div>
      </main>
    );
  }
  return children(user.email ?? "");
}
