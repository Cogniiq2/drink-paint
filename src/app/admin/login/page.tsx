import { LoginForm } from "@/components/admin/LoginForm";
import { adminConfigured } from "@/lib/admin/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="font-display text-3xl mb-6">Anmelden</h1>
      {!adminConfigured() && <p className="mb-4 text-xs bg-amber-50 border border-amber-300 rounded-xs p-3">ADMIN_PASSWORD und ADMIN_SESSION_SECRET sind nicht gesetzt. Siehe .env.example.</p>}
      <LoginForm next={next ?? "/admin"} />
    </div>
  );
}
