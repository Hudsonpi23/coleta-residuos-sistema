"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  LayoutDashboard,
  MapPin,
  Route,
  Calendar,
  Play,
  ListFilter,
  Package,
  Building2,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Recycle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" as const },
  { href: "/pontos-coleta", label: "Pontos de Coleta", icon: MapPin, permission: "collection-points:read" as const },
  { href: "/rotas", label: "Rotas", icon: Route, permission: "routes:read" as const },
  { href: "/agenda", label: "Agenda", icon: Calendar, permission: "assignments:read" as const },
  { href: "/execucao", label: "Execução", icon: Play, permission: "runs:read" as const },
  { href: "/triagem", label: "Triagem", icon: ListFilter, permission: "sorting:read" as const },
  { href: "/estoque", label: "Estoque", icon: Package, permission: "stock:read" as const },
  { href: "/destinos", label: "Destinos", icon: Building2, permission: "destinations:read" as const },
  { href: "/equipes", label: "Equipes", icon: Users, permission: "teams:read" as const },
  { href: "/veiculos", label: "Veículos", icon: Truck, permission: "vehicles:read" as const },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, permission: "reports:view" as const },
  { href: "/configuracoes", label: "Configurações", icon: Settings, permission: "material-types:read" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = menuItems.filter((item) => hasPermission(item.permission));

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-zinc-950 text-zinc-100 border-r border-zinc-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">EcoColeta</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-emerald-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-zinc-800" />

      {/* User Info */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-9 w-9 bg-zinc-700">
            <AvatarFallback className="bg-emerald-600 text-white text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.orgName}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full mt-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10",
            collapsed ? "h-9 w-9" : "justify-start"
          )}
          onClick={logout}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
