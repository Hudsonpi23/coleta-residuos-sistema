"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR_OPERACAO: "Gestor de Operação",
  ALMOXARIFE: "Almoxarife",
  SUPERVISOR: "Supervisor",
  COLETOR: "Coletor",
  TRIAGEM: "Triagem",
  VISUALIZADOR: "Visualizador",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  GESTOR_OPERACAO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ALMOXARIFE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  SUPERVISOR: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  COLETOR: "bg-green-500/20 text-green-400 border-green-500/30",
  TRIAGEM: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  VISUALIZADOR: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function Header({ title, description, children }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between py-6 px-8 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          {description && (
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
        {user && (
          <Badge variant="outline" className={roleColors[user.role] || roleColors.VISUALIZADOR}>
            {roleLabels[user.role] || user.role}
          </Badge>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
