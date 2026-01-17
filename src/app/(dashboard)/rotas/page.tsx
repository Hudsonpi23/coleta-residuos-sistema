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
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Route, MapPin, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

interface RouteStop {
  id: string;
  orderIndex: number;
  point: {
    id: string;
    name: string;
    address: string;
  };
}

interface RouteData {
  id: string;
  name: string;
  description: string | null;
  stops: RouteStop[];
  _count: {
    assignments: number;
  };
}

export default function RoutesPage() {
  const { hasPermission } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const canCreate = hasPermission("routes:create");
  const canUpdate = hasPermission("routes:update");
  const canDelete = hasPermission("routes:delete");

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/routes");
      const json = await res.json();
      if (json.success) {
        setRoutes(json.data);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      toast.error("Erro ao carregar rotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRoute
        ? `/api/routes/${editingRoute.id}`
        : "/api/routes";
      const method = editingRoute ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }

      toast.success(editingRoute ? "Rota atualizada!" : "Rota criada!");
      setDialogOpen(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch {
      toast.error("Erro ao salvar rota");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta rota?")) return;

    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Rota excluída!");
      fetchRoutes();
    } catch {
      toast.error("Erro ao excluir rota");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
  };

  const openEditDialog = (route: RouteData) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<RouteData>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => row.original.description || <span className="text-zinc-500">-</span>,
    },
    {
      accessorKey: "stops",
      header: "Paradas",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-zinc-400" />
          <span>{row.original.stops.length} paradas</span>
        </div>
      ),
    },
    {
      accessorKey: "_count.assignments",
      header: "Agendamentos",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
          {row.original._count.assignments}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/rotas/${row.original.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
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
        title="Rotas"
        description="Gerencie as rotas de coleta"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingRoute(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Rota
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {editingRoute ? "Editar Rota" : "Nova Rota"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da rota
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
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            data={routes}
            searchKey="name"
            searchPlaceholder="Buscar por nome..."
          />
        )}
      </PageContainer>
    </>
  );
}
