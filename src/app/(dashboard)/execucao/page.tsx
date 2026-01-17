"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Route, Users, Truck, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectionRun {
  id: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  assignment: {
    date: string;
    shift: string | null;
    route: { name: string };
    team: { name: string };
    vehicle: { plate: string };
  };
  events: Array<{
    id: string;
    status: string;
    stop: {
      point: { name: string; address: string };
    };
  }>;
}

const statusColors: Record<string, string> = {
  AGENDADO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EM_ANDAMENTO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONCLUIDO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELADO: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  AGENDADO: "Agendado",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default function ExecutionListPage() {
  const [runs, setRuns] = useState<CollectionRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/runs");
      const json = await res.json();
      if (json.success) {
        setRuns(json.data);
      }
    } catch (error) {
      console.error("Error fetching runs:", error);
      toast.error("Erro ao carregar execuções");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const getEventStats = (events: CollectionRun["events"]) => {
    const completed = events.filter((e) => e.status === "COLETADO").length;
    const skipped = events.filter((e) => e.status === "NAO_COLETADO").length;
    const pending = events.filter((e) => e.status === "PENDENTE" || e.status === "EM_ANDAMENTO").length;
    return { completed, skipped, pending, total: events.length };
  };

  return (
    <>
      <Header
        title="Execuções"
        description="Acompanhe as coletas em andamento e finalizadas"
      />
      <PageContainer>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : runs.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Nenhuma execução encontrada</p>
              <p className="text-sm text-zinc-500 mt-1">
                Inicie uma execução a partir da Agenda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {runs.map((run) => {
              const stats = getEventStats(run.events);
              
              return (
                <Link key={run.id} href={`/execucao/${run.id}`}>
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                            <Play className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-zinc-100">
                              {run.assignment.route.name}
                            </CardTitle>
                            <p className="text-sm text-zinc-400">
                              {format(new Date(run.assignment.date), "dd/MM/yyyy", { locale: ptBR })}
                              {run.assignment.shift && ` - ${run.assignment.shift}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusColors[run.status]}>
                          {statusLabels[run.status] || run.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300">{run.assignment.team.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300 font-mono">{run.assignment.vehicle.plate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300">{stats.total} paradas</span>
                        </div>
                        {run.startedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">
                              {format(new Date(run.startedAt), "HH:mm")}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-zinc-400">{stats.completed} coletadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-zinc-400">{stats.skipped} não coletadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-zinc-400">{stats.pending} pendentes</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${((stats.completed + stats.skipped) / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
