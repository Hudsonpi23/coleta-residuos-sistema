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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

interface Destination {
  id: string;
  name: string;
  type: string;
  address: string | null;
  contact: string | null;
  phone: string | null;
}

const typeLabels: Record<string, string> = {
  COOPERATIVA: "Cooperativa",
  ATERRO: "Aterro Sanitário",
  INDUSTRIA: "Indústria Recicladora",
  COMPOSTAGEM: "Compostagem",
};

const typeColors: Record<string, string> = {
  COOPERATIVA: "bg-green-500/20 text-green-400 border-green-500/30",
  ATERRO: "bg-red-500/20 text-red-400 border-red-500/30",
  INDUSTRIA: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPOSTAGEM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function DestinationsPage() {
  const { hasPermission } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    contact: "",
    phone: "",
  });

  const canCreate = hasPermission("destinations:create");
  const canUpdate = hasPermission("destinations:update");
  const canDelete = hasPermission("destinations:delete");

  const fetchDestinations = async () => {
    try {
      const res = await fetch("/api/destinations");
      const json = await res.json();
      if (json.success) {
        setDestinations(json.data);
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
      toast.error("Erro ao carregar destinos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingDestination
        ? `/api/destinations/${editingDestination.id}`
        : "/api/destinations";
      const method = editingDestination ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          address: formData.address || undefined,
          contact: formData.contact || undefined,
          phone: formData.phone || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }

      toast.success(editingDestination ? "Destino atualizado!" : "Destino criado!");
      setDialogOpen(false);
      setEditingDestination(null);
      resetForm();
      fetchDestinations();
    } catch {
      toast.error("Erro ao salvar destino");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este destino?")) return;

    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Destino excluído!");
      fetchDestinations();
    } catch {
      toast.error("Erro ao excluir destino");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", type: "", address: "", contact: "", phone: "" });
  };

  const openEditDialog = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      type: destination.type,
      address: destination.address || "",
      contact: destination.contact || "",
      phone: destination.phone || "",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Destination>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="outline" className={typeColors[row.original.type] || ""}>
          {typeLabels[row.original.type] || row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "address",
      header: "Endereço",
      cell: ({ row }) => row.original.address || <span className="text-zinc-500">-</span>,
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
        title="Destinos"
        description="Gerencie os destinos de materiais"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingDestination(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Destino
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {editingDestination ? "Editar Destino" : "Novo Destino"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do destino
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
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="COOPERATIVA">Cooperativa</SelectItem>
                        <SelectItem value="ATERRO">Aterro Sanitário</SelectItem>
                        <SelectItem value="INDUSTRIA">Indústria Recicladora</SelectItem>
                        <SelectItem value="COMPOSTAGEM">Compostagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
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
                    disabled={submitting || !formData.type}
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
            data={destinations}
            searchKey="name"
            searchPlaceholder="Buscar por nome..."
          />
        )}
      </PageContainer>
    </>
  );
}
