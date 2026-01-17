"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Play,
  Square,
  Plus,
  Trash2,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MaterialType {
  id: string;
  name: string;
  category: string | null;
  defaultUnit: string;
}

interface CollectedItem {
  id: string;
  quantity: number;
  unit: string;
  isEstimated: boolean;
  materialType: MaterialType;
}

interface CollectionEvent {
  id: string;
  status: string;
  arrivedAt: string | null;
  departedAt: string | null;
  notes: string | null;
  skipReason: string | null;
  stop: {
    id: string;
    orderIndex: number;
    point: {
      name: string;
      address: string;
      type: string | null;
    };
  };
  items: CollectedItem[];
}

interface CollectionRun {
  id: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
  assignment: {
    date: string;
    shift: string | null;
    route: { name: string };
    team: { name: string };
    vehicle: { plate: string };
  };
  events: CollectionEvent[];
}

const statusColors: Record<string, string> = {
  PENDENTE: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  EM_ANDAMENTO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COLETADO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  NAO_COLETADO: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  COLETADO: "Coletado",
  NAO_COLETADO: "Não Coletado",
};

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [run, setRun] = useState<CollectionRun | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CollectionEvent | null>(null);
  const [dialogMode, setDialogMode] = useState<"collect" | "close" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [collectForm, setCollectForm] = useState<{
    items: Array<{ materialTypeId: string; quantity: string; unit: string }>;
    notes: string;
  }>({
    items: [],
    notes: "",
  });

  const [closeForm, setCloseForm] = useState({
    status: "COLETADO" as "COLETADO" | "NAO_COLETADO",
    skipReason: "",
  });

  const fetchRun = async () => {
    try {
      const [runRes, materialsRes] = await Promise.all([
        fetch(`/api/runs/${runId}`),
        fetch("/api/material-types"),
      ]);

      const [runJson, materialsJson] = await Promise.all([
        runRes.json(),
        materialsRes.json(),
      ]);

      if (runJson.success) setRun(runJson.data);
      if (materialsJson.success) setMaterialTypes(materialsJson.data);
    } catch (error) {
      console.error("Error fetching run:", error);
      toast.error("Erro ao carregar execução");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
  }, [runId]);

  const handleArrive = async (stopId: string) => {
    try {
      const res = await fetch(`/api/runs/${runId}/stop/${stopId}/arrive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao registrar chegada");
        return;
      }

      toast.success("Chegada registrada!");
      fetchRun();
    } catch {
      toast.error("Erro ao registrar chegada");
    }
  };

  const openCollectDialog = (event: CollectionEvent) => {
    setSelectedEvent(event);
    setCollectForm({
      items: event.items.map((item) => ({
        materialTypeId: item.materialType.id,
        quantity: item.quantity.toString(),
        unit: item.unit,
      })),
      notes: event.notes || "",
    });
    setDialogMode("collect");
  };

  const openCloseDialog = (event: CollectionEvent) => {
    setSelectedEvent(event);
    setCloseForm({
      status: "COLETADO",
      skipReason: "",
    });
    setDialogMode("close");
  };

  const handleCollect = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/runs/${runId}/stop/${selectedEvent.stop.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: collectForm.items
            .filter((item) => item.materialTypeId && parseFloat(item.quantity) > 0)
            .map((item) => ({
              materialTypeId: item.materialTypeId,
              quantity: parseFloat(item.quantity),
              unit: item.unit || "kg",
              isEstimated: true,
            })),
          notes: collectForm.notes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao registrar coleta");
        return;
      }

      toast.success("Itens registrados!");
      setDialogMode(null);
      setSelectedEvent(null);
      fetchRun();
    } catch {
      toast.error("Erro ao registrar coleta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/runs/${runId}/stop/${selectedEvent.stop.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: closeForm.status,
          skipReason: closeForm.skipReason || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao finalizar parada");
        return;
      }

      toast.success("Parada finalizada!");
      setDialogMode(null);
      setSelectedEvent(null);
      fetchRun();
    } catch {
      toast.error("Erro ao finalizar parada");
    } finally {
      setSubmitting(false);
    }
  };

  const finishRun = async () => {
    if (!confirm("Tem certeza que deseja finalizar esta execução?")) return;

    try {
      const res = await fetch(`/api/runs/${runId}/finish`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao finalizar execução");
        return;
      }

      toast.success("Execução finalizada!");
      fetchRun();
    } catch {
      toast.error("Erro ao finalizar execução");
    }
  };

  const addItem = () => {
    setCollectForm({
      ...collectForm,
      items: [...collectForm.items, { materialTypeId: "", quantity: "", unit: "kg" }],
    });
  };

  const removeItem = (index: number) => {
    setCollectForm({
      ...collectForm,
      items: collectForm.items.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <>
        <Header title="Execução" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!run) {
    return (
      <>
        <Header title="Execução" />
        <PageContainer>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-400">Execução não encontrada</p>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    );
  }

  const pendingCount = run.events.filter((e) => e.status === "PENDENTE" || e.status === "EM_ANDAMENTO").length;
  const canFinish = run.status === "EM_ANDAMENTO" && pendingCount === 0;

  return (
    <>
      <Header
        title={run.assignment.route.name}
        description={`${format(new Date(run.assignment.date), "dd/MM/yyyy")} ${run.assignment.shift ? `- ${run.assignment.shift}` : ""}`}
      >
        {canFinish && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={finishRun}
          >
            <Flag className="w-4 h-4 mr-2" />
            Finalizar Execução
          </Button>
        )}
      </Header>
      <PageContainer>
        {/* Summary Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-zinc-400">
                  Equipe: <span className="text-zinc-200">{run.assignment.team.name}</span>
                </span>
                <span className="text-zinc-400">
                  Veículo: <span className="text-zinc-200 font-mono">{run.assignment.vehicle.plate}</span>
                </span>
                {run.startedAt && (
                  <span className="text-zinc-400">
                    Início: <span className="text-zinc-200">{format(new Date(run.startedAt), "HH:mm")}</span>
                  </span>
                )}
              </div>
              <Badge className={run.status === "CONCLUIDO" ? statusColors.COLETADO : statusColors.EM_ANDAMENTO}>
                {run.status === "CONCLUIDO" ? "Concluído" : "Em Andamento"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stops List */}
        <div className="space-y-4">
          {run.events
            .sort((a, b) => a.stop.orderIndex - b.stop.orderIndex)
            .map((event, index) => (
              <Card key={event.id} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base text-zinc-100">
                          {event.stop.point.name}
                        </CardTitle>
                        <p className="text-sm text-zinc-400">{event.stop.point.address}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[event.status]}>
                      {statusLabels[event.status] || event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Collected items */}
                  {event.items.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-zinc-800/50">
                      <p className="text-xs text-zinc-500 mb-2">Itens coletados:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.items.map((item) => (
                          <Badge key={item.id} variant="outline" className="bg-zinc-700/50">
                            {item.materialType.name}: {item.quantity} {item.unit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {event.notes && (
                    <p className="text-sm text-zinc-400 mb-4">
                      <span className="text-zinc-500">Obs:</span> {event.notes}
                    </p>
                  )}

                  {/* Skip reason */}
                  {event.skipReason && (
                    <p className="text-sm text-red-400 mb-4">
                      <span className="text-red-500">Motivo:</span> {event.skipReason}
                    </p>
                  )}

                  {/* Actions */}
                  {run.status === "EM_ANDAMENTO" && (
                    <div className="flex items-center gap-2">
                      {event.status === "PENDENTE" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleArrive(event.stop.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Cheguei
                        </Button>
                      )}
                      {event.status === "EM_ANDAMENTO" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700"
                            onClick={() => openCollectDialog(event)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Registrar Itens
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openCloseDialog(event)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Finalizar
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  {(event.arrivedAt || event.departedAt) && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-4 text-xs text-zinc-500">
                      {event.arrivedAt && (
                        <span>
                          <Clock className="w-3 h-3 inline mr-1" />
                          Chegada: {format(new Date(event.arrivedAt), "HH:mm")}
                        </span>
                      )}
                      {event.departedAt && (
                        <span>
                          <Clock className="w-3 h-3 inline mr-1" />
                          Saída: {format(new Date(event.departedAt), "HH:mm")}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Collect Dialog */}
        <Dialog open={dialogMode === "collect"} onOpenChange={() => setDialogMode(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Coleta</DialogTitle>
              <DialogDescription>
                {selectedEvent?.stop.point.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {collectForm.items.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Material</Label>
                    <Select
                      value={item.materialTypeId}
                      onValueChange={(value) => {
                        const newItems = [...collectForm.items];
                        newItems[index].materialTypeId = value;
                        setCollectForm({ ...collectForm, items: newItems });
                      }}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {materialTypes.map((mt) => (
                          <SelectItem key={mt.id} value={mt.id}>
                            {mt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Qtd</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...collectForm.items];
                        newItems[index].quantity = e.target.value;
                        setCollectForm({ ...collectForm, items: newItems });
                      }}
                      className="bg-zinc-800 border-zinc-700"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="w-20 space-y-2">
                    <Label>Un.</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => {
                        const newItems = [...collectForm.items];
                        newItems[index].unit = e.target.value;
                        setCollectForm({ ...collectForm, items: newItems });
                      }}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-red-400"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </Button>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={collectForm.notes}
                  onChange={(e) => setCollectForm({ ...collectForm, notes: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogMode(null)}
                className="bg-zinc-800 border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCollect}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Dialog */}
        <Dialog open={dialogMode === "close"} onOpenChange={() => setDialogMode(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Finalizar Parada</DialogTitle>
              <DialogDescription>
                {selectedEvent?.stop.point.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={closeForm.status}
                  onValueChange={(value: "COLETADO" | "NAO_COLETADO") =>
                    setCloseForm({ ...closeForm, status: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="COLETADO">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Coletado
                      </div>
                    </SelectItem>
                    <SelectItem value="NAO_COLETADO">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Não Coletado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {closeForm.status === "NAO_COLETADO" && (
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Textarea
                    value={closeForm.skipReason}
                    onChange={(e) => setCloseForm({ ...closeForm, skipReason: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="Informe o motivo..."
                    rows={2}
                    required
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogMode(null)}
                className="bg-zinc-800 border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClose}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting || (closeForm.status === "NAO_COLETADO" && !closeForm.skipReason)}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
