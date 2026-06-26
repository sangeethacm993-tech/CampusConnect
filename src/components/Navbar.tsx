/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";
import { LogOut, Shield, GraduationCap, Briefcase, Sparkles, Building } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const getRoleIcon = () => {
    switch (user?.role) {
      case "admin":
        return <Shield className="w-4 h-4 text-rose-500" id="role-icon-admin" />;
      case "staff":
        return <Briefcase className="w-4 h-4 text-emerald-500" id="role-icon-staff" />;
      case "student":
        return <GraduationCap className="w-4 h-4 text-violet-500" id="role-icon-student" />;
      default:
        return null;
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "staff":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "student":
        return "bg-violet-50 text-violet-700 border-violet-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs" id="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
              <Building className="w-5 h-5" id="brand-logo-icon" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                CampusConnect
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Smart Complaint Tracking System
              </span>
            </div>
          </div>

          {/* User Profile / Logout Actions */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-800 leading-none">
                  {user.name}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {user.department}
                </span>
              </div>

              {/* Role badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass()}`} id="navbar-role-badge">
                {getRoleIcon()}
                <span className="capitalize">{user.role}</span>
              </div>

              {/* Action Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-sm font-semibold border border-transparent hover:border-rose-100"
                id="btn-nav-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                SYSTEM LOCK
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
