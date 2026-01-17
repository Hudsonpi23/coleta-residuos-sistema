"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
  capacityKg: number | null;
}

export default function VehiclesPage() {
  const { hasPermission } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    plate: "",
    model: "",
    capacityKg: "",
  });

  const canCreate = hasPermission("vehicles:create");
  const canUpdate = hasPermission("vehicles:update");
  const canDelete = hasPermission("vehicles:delete");

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.success) {
        setVehicles(json.data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingVehicle
        ? `/api/vehicles/${editingVehicle.id}`
        : "/api/vehicles";
      const method = editingVehicle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: formData.plate,
          model: formData.model || undefined,
          capacityKg: formData.capacityKg ? parseFloat(formData.capacityKg) : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }

      toast.success(editingVehicle ? "Veículo atualizado!" : "Veículo criado!");
      setDialogOpen(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch {
      toast.error("Erro ao salvar veículo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Veículo excluído!");
      fetchVehicles();
    } catch {
      toast.error("Erro ao excluir veículo");
    }
  };

  const resetForm = () => {
    setFormData({ plate: "", model: "", capacityKg: "" });
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model || "",
      capacityKg: vehicle.capacityKg?.toString() || "",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "plate",
      header: "Placa",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium font-mono">{row.original.plate}</span>
        </div>
      ),
    },
    {
      accessorKey: "model",
      header: "Modelo",
      cell: ({ row }) => row.original.model || <span className="text-zinc-500">-</span>,
    },
    {
      accessorKey: "capacityKg",
      header: "Capacidade",
      cell: ({ row }) =>
        row.original.capacityKg
          ? `${row.original.capacityKg.toLocaleString("pt-BR")} kg`
          : <span className="text-zinc-500">-</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              onClick={() => openEditDialog(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-400"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Veículos"
        description="Gerencie os veículos de coleta"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingVehicle(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do veículo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate">Placa *</Label>
                    <Input
                      id="plate"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      className="bg-zinc-800 border-zinc-700 font-mono"
                      placeholder="ABC-1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacityKg">Capacidade (kg)</Label>
                    <Input
                      id="capacityKg"
                      type="number"
                      value={formData.capacityKg}
                      onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      min="0"
                      step="100"
                    />
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
                      "Salvar"
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
        ) : (
          <DataTable
            columns={columns}
            data={vehicles}
            searchKey="plate"
            searchPlaceholder="Buscar por placa..."
          />
        )}
      </PageContainer>
    </>
  );
}
