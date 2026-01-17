"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  type: string | null;
  contact: string | null;
  phone: string | null;
  notes: string | null;
  lat: number | null;
  lng: number | null;
}

const typeLabels: Record<string, string> = {
  residencia: "Residência",
  comercio: "Comércio",
  condominio: "Condomínio",
  ecoponto: "Ecoponto",
};

const typeColors: Record<string, string> = {
  residencia: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  comercio: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  condominio: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ecoponto: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function CollectionPointsPage() {
  const { hasPermission } = useAuth();
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CollectionPoint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "",
    contact: "",
    phone: "",
    notes: "",
  });

  const canCreate = hasPermission("collection-points:create");
  const canUpdate = hasPermission("collection-points:update");
  const canDelete = hasPermission("collection-points:delete");

  const fetchPoints = async () => {
    try {
      const res = await fetch("/api/collection-points");
      const json = await res.json();
      if (json.success) {
        setPoints(json.data);
      }
    } catch (error) {
      console.error("Error fetching points:", error);
      toast.error("Erro ao carregar pontos de coleta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingPoint
        ? `/api/collection-points/${editingPoint.id}`
        : "/api/collection-points";
      const method = editingPoint ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: formData.type || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }

      toast.success(editingPoint ? "Ponto atualizado!" : "Ponto criado!");
      setDialogOpen(false);
      setEditingPoint(null);
      resetForm();
      fetchPoints();
    } catch {
      toast.error("Erro ao salvar ponto de coleta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;

    try {
      const res = await fetch(`/api/collection-points/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Ponto excluído!");
      fetchPoints();
    } catch {
      toast.error("Erro ao excluir ponto de coleta");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      type: "",
      contact: "",
      phone: "",
      notes: "",
    });
  };

  const openEditDialog = (point: CollectionPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      address: point.address,
      type: point.type || "",
      contact: point.contact || "",
      phone: point.phone || "",
      notes: point.notes || "",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<CollectionPoint>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Endereço",
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.type;
        if (!type) return <span className="text-zinc-500">-</span>;
        return (
          <Badge variant="outline" className={typeColors[type] || ""}>
            {typeLabels[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contato",
      cell: ({ row }) => row.original.contact || <span className="text-zinc-500">-</span>,
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => row.original.phone || <span className="text-zinc-500">-</span>,
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
        title="Pontos de Coleta"
        description="Gerencie os locais de coleta de resíduos"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingPoint(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Ponto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {editingPoint ? "Editar Ponto" : "Novo Ponto de Coleta"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do ponto de coleta
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="residencia">Residência</SelectItem>
                        <SelectItem value="comercio">Comércio</SelectItem>
                        <SelectItem value="condominio">Condomínio</SelectItem>
                        <SelectItem value="ecoponto">Ecoponto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contato</Label>
                      <Input
                        id="contact"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      rows={3}
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
            data={points}
            searchKey="name"
            searchPlaceholder="Buscar por nome..."
          />
        )}
      </PageContainer>
    </>
  );
}
