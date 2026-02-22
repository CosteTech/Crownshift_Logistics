"use client";

import { useAuth } from "@/hooks/use-auth";
import { Search, Bell, User, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions";

export default function AdminNavbar() {
  const { user, isLoading } = useAuth();

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      {/* Search Bar */}
      <div className="relative w-96 hidden md:block">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search shipments or users..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
        />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-4 ml-auto">
        <button className="p-2 text-slate-400 hover:text-white transition-colors relative" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950"></span>
        </button>

        <div className="h-8 w-[1px] bg-slate-800"></div>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user?.displayName || user?.email?.split('@')[0] || "Admin User"}
            </p>
            <p className="text-xs text-slate-500">System Administrator</p>
          </div>
          
          <div className="group relative">
            <button className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-slate-800 hover:border-blue-400 transition-all" title="User menu">
              <User className="h-5 w-5" />
            </button>
            
            {/* Dropdown on Hover */}
            <div className="absolute right-0 w-48 mt-2 py-2 bg-slate-900 border border-slate-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <a href="/admin/settings" className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                <Settings className="mr-3 h-4 w-4" /> Settings
              </a>
              <form action={logoutAction} className="w-full">
                <button 
                  type="submit"
                  className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" /> Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
