import { logoutAction } from "@/app/actions";
import { getAdminAuth } from "@/firebase/server-init";
import { cookies } from "next/headers";
import Link from "next/link";
import AdminNavbar from "@/components/admin/Navbar";

export const metadata = {
  title: "Admin — Crownshift Logistics",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  let displayName = "Admin";

  try {
    if (sessionCookie) {
      const auth = getAdminAuth();
      const decodedToken = await auth.verifySessionCookie(sessionCookie);
      const user = await auth.getUser(decodedToken.uid);
      if (user.email) {
        const emailName = user.email.split('@')[0];
        displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
  } catch (error) {
    console.error("Layout Auth Error:", error);
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-orange-500 tracking-tight">Crownshift Admin</h2>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Welcome Admin-<span className="text-white">{displayName}</span>
          </p>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">📊 Dashboard</Link>
          <Link href="/admin/shipments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">📦 Shipments</Link>
          <Link href="/admin/services" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">🛠️ Services</Link>
          <Link href="/admin/offers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">🏷️ Offers</Link>
          <Link href="/admin/reviews" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">⭐ Reviews</Link>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <form action={logoutAction}>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all active:scale-95 shadow-lg shadow-red-900/20">🚪 Logout</button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Navbar */}
        <AdminNavbar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
