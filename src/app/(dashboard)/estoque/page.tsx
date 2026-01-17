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
  Package,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

interface MaterialType {
  id: string;
  name: string;
  category: string | null;
}

interface StockLot {
  id: string;
  totalKg: number;
  availableKg: number;
  qualityGrade: string | null;
  originNote: string | null;
  createdAt: string;
  materialType: MaterialType;
}

interface Destination {
  id: string;
  name: string;
  type: string;
}

interface Vehicle {
  id: string;
  plate: string;
}

interface StockSummary {
  byMaterial: Array<{
    materialType: MaterialType;
    availableKg: number;
    totalKg: number;
    lotsCount: number;
  }>;
  totals: {
    availableKg: number;
    totalKg: number;
    lotsCount: number;
  };
}

const gradeColors: Record<string, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  C: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function EstoquePage() {
  const { hasPermission } = useAuth();
  const [lots, setLots] = useState<StockLot[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<StockLot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [movementForm, setMovementForm] = useState({
    type: "OUT" as "OUT" | "ADJUST",
    quantityKg: "",
    destinationId: "",
    vehicleId: "",
    invoiceRef: "",
    notes: "",
  });

  const canMovement = hasPermission("stock:movement");

  const fetchData = async () => {
    try {
      const [lotsRes, summaryRes, destinationsRes, vehiclesRes] = await Promise.all([
        fetch("/api/stock/lots?hasStock=true"),
        fetch("/api/stock/summary"),
        fetch("/api/destinations"),
        fetch("/api/vehicles"),
      ]);

      const [lotsJson, summaryJson, destinationsJson, vehiclesJson] = await Promise.all([
        lotsRes.json(),
        summaryRes.json(),
        destinationsRes.json(),
        vehiclesRes.json(),
      ]);

      if (lotsJson.success) setLots(lotsJson.data);
      if (summaryJson.success) setSummary(summaryJson.data);
      if (destinationsJson.success) setDestinations(destinationsJson.data);
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

  const openMovementDialog = (lot: StockLot) => {
    setSelectedLot(lot);
    setMovementForm({
      type: "OUT",
      quantityKg: "",
      destinationId: "",
      vehicleId: "",
      invoiceRef: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const createMovement = async () => {
    if (!selectedLot) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: selectedLot.id,
          type: movementForm.type,
          quantityKg: parseFloat(movementForm.quantityKg),
          destinationId: movementForm.destinationId || undefined,
          vehicleId: movementForm.vehicleId || undefined,
          invoiceRef: movementForm.invoiceRef || undefined,
          notes: movementForm.notes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao registrar movimento");
        return;
      }

      toast.success("Movimento registrado!");
      setDialogOpen(false);
      setSelectedLot(null);
      fetchData();
    } catch {
      toast.error("Erro ao registrar movimento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="Estoque"
        description="Gerencie os lotes de materiais em estoque"
      />
      <PageContainer>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Total Disponível</p>
                        <p className="text-2xl font-bold text-zinc-100">
                          {summary.totals.availableKg.toLocaleString("pt-BR")} kg
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Total Processado</p>
                        <p className="text-2xl font-bold text-zinc-100">
                          {summary.totals.totalKg.toLocaleString("pt-BR")} kg
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Lotes Ativos</p>
                        <p className="text-2xl font-bold text-zinc-100">
                          {summary.totals.lotsCount}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-amber-600/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stock by Material */}
            {summary && summary.byMaterial.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Estoque por Material</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.byMaterial.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-zinc-500" />
                          <div>
                            <p className="font-medium text-zinc-200">{item.materialType.name}</p>
                            <p className="text-xs text-zinc-500">{item.lotsCount} lotes</p>
                          </div>
                        </div>
                        <span className="font-medium text-zinc-200">
                          {item.availableKg.toLocaleString("pt-BR")} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lots List */}
            {lots.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400">Nenhum lote com estoque disponível</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-200">Lotes Disponíveis</h3>
                {lots.map((lot) => (
                  <Card key={lot.id} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Package className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-200">{lot.materialType.name}</p>
                            <p className="text-sm text-zinc-500">
                              {lot.originNote || `Lote de ${format(new Date(lot.createdAt), "dd/MM/yyyy")}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {lot.qualityGrade && (
                            <Badge className={gradeColors[lot.qualityGrade]}>
                              {lot.qualityGrade}
                            </Badge>
                          )}
                          <div className="text-right">
                            <p className="font-medium text-zinc-200">
                              {lot.availableKg.toLocaleString("pt-BR")} kg
                            </p>
                            <p className="text-xs text-zinc-500">
                              de {lot.totalKg.toLocaleString("pt-BR")} kg
                            </p>
                          </div>
                          {canMovement && lot.availableKg > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-zinc-800 border-zinc-700"
                              onClick={() => openMovementDialog(lot)}
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-1" />
                              Saída
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Movement Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Registrar Saída</DialogTitle>
              <DialogDescription>
                {selectedLot?.materialType.name} - Disponível: {selectedLot?.availableKg} kg
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Movimento</Label>
                <Select
                  value={movementForm.type}
                  onValueChange={(value: "OUT" | "ADJUST") =>
                    setMovementForm({ ...movementForm, type: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="OUT">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-red-500" />
                        Saída
                      </div>
                    </SelectItem>
                    <SelectItem value="ADJUST">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-amber-500" />
                        Ajuste
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade (kg) *</Label>
                <Input
                  type="number"
                  value={movementForm.quantityKg}
                  onChange={(e) => setMovementForm({ ...movementForm, quantityKg: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  min="0"
                  max={selectedLot?.availableKg}
                  step="0.1"
                />
              </div>
              {movementForm.type === "OUT" && (
                <>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select
                      value={movementForm.destinationId}
                      onValueChange={(value) => setMovementForm({ ...movementForm, destinationId: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {destinations.map((dest) => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Veículo</Label>
                    <Select
                      value={movementForm.vehicleId}
                      onValueChange={(value) => setMovementForm({ ...movementForm, vehicleId: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {vehicles.map((veh) => (
                          <SelectItem key={veh.id} value={veh.id}>
                            {veh.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nota Fiscal / Recibo</Label>
                    <Input
                      value={movementForm.invoiceRef}
                      onChange={(e) => setMovementForm({ ...movementForm, invoiceRef: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="bg-zinc-800 border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={createMovement}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting || !movementForm.quantityKg}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
