import Link from "next/link";
import AdminNavbar from "@/components/admin/Navbar";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";

export const metadata = {
  title: "Admin - Crownshift Logistics",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedAdminRoute>
      <div className="flex h-screen bg-slate-950 text-slate-200">
        <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-orange-500 tracking-tight">Crownshift Admin</h2>
            <p className="text-sm text-slate-300 mt-2 font-medium">Authorized access only</p>
          </div>

          <nav className="flex-grow p-4 space-y-1">
            <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">Dashboard</Link>
            <Link href="/admin/shipments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">Shipments</Link>
            <Link href="/admin/services" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">Services</Link>
            <Link href="/admin/offers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">Offers</Link>
            <Link href="/admin/reviews" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">Reviews</Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminNavbar />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
