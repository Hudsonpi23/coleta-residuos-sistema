"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Route, Users, Truck, Play, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Assignment {
  id: string;
  date: string;
  shift: string | null;
  route: {
    id: string;
    name: string;
    stops: Array<{ point: { name: string } }>;
  };
  team: {
    id: string;
    name: string;
    members: Array<{ employee: { name: string } }>;
  };
  vehicle: {
    id: string;
    plate: string;
    model: string | null;
  };
  runs: Array<{
    id: string;
    status: string;
    _count: { events: number };
  }>;
}

interface RouteData {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
}

const shiftLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const statusColors: Record<string, string> = {
  AGENDADO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EM_ANDAMENTO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONCLUIDO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELADO: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AgendaPage() {
  const { hasPermission } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    routeId: "",
    teamId: "",
    vehicleId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "",
  });

  const canCreate = hasPermission("assignments:create");

  const fetchData = async () => {
    try {
      const [assignmentsRes, routesRes, teamsRes, vehiclesRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/routes"),
        fetch("/api/teams"),
        fetch("/api/vehicles"),
      ]);

      const [assignmentsJson, routesJson, teamsJson, vehiclesJson] = await Promise.all([
        assignmentsRes.json(),
        routesRes.json(),
        teamsRes.json(),
        vehiclesRes.json(),
      ]);

      if (assignmentsJson.success) setAssignments(assignmentsJson.data);
      if (routesJson.success) setRoutes(routesJson.data);
      if (teamsJson.success) setTeams(teamsJson.data);
      if (vehiclesJson.success) setVehicles(vehiclesJson.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          shift: formData.shift || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao criar agendamento");
        return;
      }

      toast.success("Agendamento criado!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: "",
      teamId: "",
      vehicleId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "",
    });
  };

  const startRun = async (assignmentId: string) => {
    try {
      const res = await fetch("/api/runs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao iniciar execução");
        return;
      }

      toast.success("Execução iniciada!");
      fetchData();
    } catch {
      toast.error("Erro ao iniciar execução");
    }
  };

  return (
    <>
      <Header
        title="Agenda"
        description="Planeje e gerencie os agendamentos de coleta"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Agende uma rota para uma equipe e veículo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rota *</Label>
                    <Select
                      value={formData.routeId}
                      onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                      required
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione a rota" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Equipe *</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                      required
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione a equipe" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Veículo *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                      required
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate} {vehicle.model && `- ${vehicle.model}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Turno</Label>
                      <Select
                        value={formData.shift}
                        onValueChange={(value) => setFormData({ ...formData, shift: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="bg-zinc-800 border-zinc-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Agendar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </Header>
      <PageContainer>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Nenhum agendamento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const activeRun = assignment.runs.find((r) => r.status === "EM_ANDAMENTO");
              const completedRun = assignment.runs.find((r) => r.status === "CONCLUIDO");
              const hasRuns = assignment.runs.length > 0;

              return (
                <Card key={assignment.id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-zinc-100">
                            {format(new Date(assignment.date), "dd 'de' MMMM", { locale: ptBR })}
                            {assignment.shift && (
                              <span className="ml-2 text-sm font-normal text-zinc-400">
                                ({shiftLabels[assignment.shift] || assignment.shift})
                              </span>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeRun ? (
                          <Link href={`/execucao/${activeRun.id}`}>
                            <Badge className={statusColors.EM_ANDAMENTO}>
                              Em Andamento
                            </Badge>
                          </Link>
                        ) : completedRun ? (
                          <Badge className={statusColors.CONCLUIDO}>
                            Concluído
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => startRun(assignment.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                        <Route className="w-5 h-5 text-zinc-400" />
                        <div>
                          <p className="text-sm text-zinc-400">Rota</p>
                          <p className="font-medium text-zinc-200">{assignment.route.name}</p>
                          <p className="text-xs text-zinc-500">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {assignment.route.stops.length} paradas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                        <Users className="w-5 h-5 text-zinc-400" />
                        <div>
                          <p className="text-sm text-zinc-400">Equipe</p>
                          <p className="font-medium text-zinc-200">{assignment.team.name}</p>
                          <p className="text-xs text-zinc-500">
                            {assignment.team.members.length} membros
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                        <Truck className="w-5 h-5 text-zinc-400" />
                        <div>
                          <p className="text-sm text-zinc-400">Veículo</p>
                          <p className="font-medium text-zinc-200 font-mono">{assignment.vehicle.plate}</p>
                          {assignment.vehicle.model && (
                            <p className="text-xs text-zinc-500">{assignment.vehicle.model}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasRuns && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500">
                          {assignment.runs.length} execução(ões) registrada(s)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
