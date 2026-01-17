"use client";

import { useEffect, useState } from "react";
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
  ListFilter,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaterialType {
  id: string;
  name: string;
  category: string | null;
}

interface SortedItem {
  id: string;
  weightKg: number;
  qualityGrade: string;
  contaminationPct: number | null;
  materialType: MaterialType;
}

interface SortingBatch {
  id: string;
  sortedAt: string;
  isClosed: boolean;
  notes: string | null;
  run: {
    id: string;
    assignment: {
      date: string;
      route: { name: string };
      team: { name: string };
    };
  };
  items: SortedItem[];
}

interface CompletedRun {
  id: string;
  status: string;
  assignment: {
    date: string;
    route: { name: string };
    team: { name: string };
  };
  _count: { sortingBatches: number };
}

const gradeColors: Record<string, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  C: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TriagemPage() {
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<SortingBatch[]>([]);
  const [runs, setRuns] = useState<CompletedRun[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<SortingBatch | null>(null);
  const [dialogMode, setDialogMode] = useState<"new" | "add" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newBatchForm, setNewBatchForm] = useState({
    runId: "",
    notes: "",
  });

  const [addItemForm, setAddItemForm] = useState({
    materialTypeId: "",
    weightKg: "",
    qualityGrade: "B",
    contaminationPct: "",
    contaminationNote: "",
  });

  const canCreate = hasPermission("sorting:create");
  const canUpdate = hasPermission("sorting:update");
  const canClose = hasPermission("sorting:close");

  const fetchData = async () => {
    try {
      const [batchesRes, runsRes, materialsRes] = await Promise.all([
        fetch("/api/sorting-batches?status=open"),
        fetch("/api/runs?status=CONCLUIDO"),
        fetch("/api/material-types"),
      ]);

      const [batchesJson, runsJson, materialsJson] = await Promise.all([
        batchesRes.json(),
        runsRes.json(),
        materialsRes.json(),
      ]);

      if (batchesJson.success) setBatches(batchesJson.data);
      if (runsJson.success) setRuns(runsJson.data.filter((r: CompletedRun) => r._count.sortingBatches === 0));
      if (materialsJson.success) setMaterialTypes(materialsJson.data);
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

  const createBatch = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/sorting-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBatchForm),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao criar triagem");
        return;
      }

      toast.success("Triagem criada!");
      setDialogMode(null);
      setNewBatchForm({ runId: "", notes: "" });
      fetchData();
    } catch {
      toast.error("Erro ao criar triagem");
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/sorting-batches/${selectedBatch.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialTypeId: addItemForm.materialTypeId,
          weightKg: parseFloat(addItemForm.weightKg),
          qualityGrade: addItemForm.qualityGrade,
          contaminationPct: addItemForm.contaminationPct
            ? parseFloat(addItemForm.contaminationPct)
            : undefined,
          contaminationNote: addItemForm.contaminationNote || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao adicionar item");
        return;
      }

      toast.success("Item adicionado!");
      setDialogMode(null);
      setAddItemForm({
        materialTypeId: "",
        weightKg: "",
        qualityGrade: "B",
        contaminationPct: "",
        contaminationNote: "",
      });
      fetchData();
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setSubmitting(false);
    }
  };

  const removeItem = async (batchId: string, itemId: string) => {
    if (!confirm("Remover este item?")) return;

    try {
      const res = await fetch(`/api/sorting-batches/${batchId}/items?itemId=${itemId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao remover item");
        return;
      }

      toast.success("Item removido!");
      fetchData();
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  const closeBatch = async (batchId: string) => {
    if (!confirm("Fechar esta triagem? Isso irá gerar os lotes em estoque.")) return;

    try {
      const res = await fetch(`/api/sorting-batches/${batchId}/close`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao fechar triagem");
        return;
      }

      toast.success("Triagem fechada! Lotes criados no estoque.");
      fetchData();
    } catch {
      toast.error("Erro ao fechar triagem");
    }
  };

  return (
    <>
      <Header
        title="Triagem"
        description="Classifique e pese os materiais coletados"
      >
        {canCreate && runs.length > 0 && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setDialogMode("new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Triagem
          </Button>
        )}
      </Header>
      <PageContainer>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : batches.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListFilter className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Nenhuma triagem em aberto</p>
              {runs.length > 0 && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setDialogMode("new")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Triagem
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => {
              const totalKg = batch.items.reduce((sum, item) => sum + item.weightKg, 0);

              return (
                <Card key={batch.id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                          <ListFilter className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-zinc-100">
                            {batch.run.assignment.route.name}
                          </CardTitle>
                          <p className="text-sm text-zinc-400">
                            {format(new Date(batch.run.assignment.date), "dd/MM/yyyy", { locale: ptBR })}
                            {" • "}{batch.run.assignment.team.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-zinc-800">
                          <Scale className="w-3 h-3 mr-1" />
                          {totalKg.toFixed(1)} kg
                        </Badge>
                        {canClose && batch.items.length > 0 && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => closeBatch(batch.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Fechar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {batch.items.length === 0 ? (
                      <p className="text-zinc-500 text-sm">Nenhum item classificado ainda</p>
                    ) : (
                      <div className="space-y-2">
                        {batch.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-zinc-500" />
                              <div>
                                <p className="font-medium text-zinc-200">{item.materialType.name}</p>
                                <p className="text-sm text-zinc-500">
                                  {item.materialType.category}
                                  {item.contaminationPct && ` • ${item.contaminationPct}% contaminação`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={gradeColors[item.qualityGrade]}>
                                {item.qualityGrade}
                              </Badge>
                              <span className="font-medium text-zinc-200">
                                {item.weightKg.toFixed(1)} kg
                              </span>
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-red-400"
                                  onClick={() => removeItem(batch.id, item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {canUpdate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 bg-zinc-800 border-zinc-700"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setDialogMode("add");
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Batch Dialog */}
        <Dialog open={dialogMode === "new"} onOpenChange={() => setDialogMode(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Nova Triagem</DialogTitle>
              <DialogDescription>
                Selecione uma execução concluída para iniciar a triagem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Execução *</Label>
                <Select
                  value={newBatchForm.runId}
                  onValueChange={(value) => setNewBatchForm({ ...newBatchForm, runId: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {runs.map((run) => (
                      <SelectItem key={run.id} value={run.id}>
                        {run.assignment.route.name} - {format(new Date(run.assignment.date), "dd/MM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={newBatchForm.notes}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, notes: e.target.value })}
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
                onClick={createBatch}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting || !newBatchForm.runId}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Item Dialog */}
        <Dialog open={dialogMode === "add"} onOpenChange={() => setDialogMode(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Adicionar Item</DialogTitle>
              <DialogDescription>
                Classifique o material coletado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Material *</Label>
                <Select
                  value={addItemForm.materialTypeId}
                  onValueChange={(value) => setAddItemForm({ ...addItemForm, materialTypeId: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {materialTypes.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id}>
                        {mt.name} {mt.category && `(${mt.category})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg) *</Label>
                  <Input
                    type="number"
                    value={addItemForm.weightKg}
                    onChange={(e) => setAddItemForm({ ...addItemForm, weightKg: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualidade</Label>
                  <Select
                    value={addItemForm.qualityGrade}
                    onValueChange={(value) => setAddItemForm({ ...addItemForm, qualityGrade: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="A">A - Excelente</SelectItem>
                      <SelectItem value="B">B - Boa</SelectItem>
                      <SelectItem value="C">C - Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contaminação (%)</Label>
                <Input
                  type="number"
                  value={addItemForm.contaminationPct}
                  onChange={(e) => setAddItemForm({ ...addItemForm, contaminationPct: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  min="0"
                  max="100"
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
                onClick={addItem}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting || !addItemForm.materialTypeId || !addItemForm.weightKg}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
