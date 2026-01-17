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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Recycle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

interface MaterialType {
  id: string;
  name: string;
  category: string | null;
  defaultUnit: string;
  requiresSorting: boolean;
  allowsContamination: boolean;
  referencePrice: number | null;
}

export default function ConfiguracoesPage() {
  const { hasPermission } = useAuth();
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    defaultUnit: "kg",
    requiresSorting: true,
    allowsContamination: false,
    referencePrice: "",
  });

  const canCreate = hasPermission("material-types:create");
  const canUpdate = hasPermission("material-types:update");
  const canDelete = hasPermission("material-types:delete");

  const fetchMaterialTypes = async () => {
    try {
      const res = await fetch("/api/material-types");
      const json = await res.json();
      if (json.success) {
        setMaterialTypes(json.data);
      }
    } catch (error) {
      console.error("Error fetching material types:", error);
      toast.error("Erro ao carregar tipos de material");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editing
        ? `/api/material-types/${editing.id}`
        : "/api/material-types";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category || undefined,
          defaultUnit: formData.defaultUnit,
          requiresSorting: formData.requiresSorting,
          allowsContamination: formData.allowsContamination,
          referencePrice: formData.referencePrice
            ? parseFloat(formData.referencePrice)
            : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }

      toast.success(editing ? "Material atualizado!" : "Material criado!");
      setDialogOpen(false);
      setEditing(null);
      resetForm();
      fetchMaterialTypes();
    } catch {
      toast.error("Erro ao salvar material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este material?")) return;

    try {
      const res = await fetch(`/api/material-types/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Material excluído!");
      fetchMaterialTypes();
    } catch {
      toast.error("Erro ao excluir material");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      defaultUnit: "kg",
      requiresSorting: true,
      allowsContamination: false,
      referencePrice: "",
    });
  };

  const openEditDialog = (mt: MaterialType) => {
    setEditing(mt);
    setFormData({
      name: mt.name,
      category: mt.category || "",
      defaultUnit: mt.defaultUnit,
      requiresSorting: mt.requiresSorting,
      allowsContamination: mt.allowsContamination,
      referencePrice: mt.referencePrice?.toString() || "",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<MaterialType>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Recycle className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
          {row.original.category || "Geral"}
        </Badge>
      ),
    },
    {
      accessorKey: "defaultUnit",
      header: "Unidade",
    },
    {
      accessorKey: "requiresSorting",
      header: "Triagem",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.requiresSorting
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-700 text-zinc-400"
          }
        >
          {row.original.requiresSorting ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      accessorKey: "referencePrice",
      header: "Preço Ref.",
      cell: ({ row }) =>
        row.original.referencePrice
          ? `R$ ${row.original.referencePrice.toFixed(2)}`
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
        title="Configurações"
        description="Configure o sistema e tipos de materiais"
      />
      <PageContainer>
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="bg-zinc-800 border-zinc-700">
            <TabsTrigger value="materials" className="data-[state=active]:bg-zinc-700">
              Tipos de Material
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200">Tipos de Material</h3>
                <p className="text-sm text-zinc-500">
                  Configure os tipos de materiais recicláveis
                </p>
              </div>
              {canCreate && (
                <Dialog
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setEditing(null);
                      resetForm();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-100">
                        {editing ? "Editar Material" : "Novo Tipo de Material"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure as propriedades do material reciclável
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="bg-zinc-800 border-zinc-700"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input
                              value={formData.category}
                              onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                              }
                              className="bg-zinc-800 border-zinc-700"
                              placeholder="Ex: PLASTICO, METAL"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unidade Padrão</Label>
                            <Input
                              value={formData.defaultUnit}
                              onChange={(e) =>
                                setFormData({ ...formData, defaultUnit: e.target.value })
                              }
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Preço de Referência (R$/kg)</Label>
                          <Input
                            type="number"
                            value={formData.referencePrice}
                            onChange={(e) =>
                              setFormData({ ...formData, referencePrice: e.target.value })
                            }
                            className="bg-zinc-800 border-zinc-700"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requiresSorting"
                              checked={formData.requiresSorting}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, requiresSorting: !!checked })
                              }
                            />
                            <Label htmlFor="requiresSorting" className="font-normal">
                              Requer triagem antes de estocar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowsContamination"
                              checked={formData.allowsContamination}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, allowsContamination: !!checked })
                              }
                            />
                            <Label htmlFor="allowsContamination" className="font-normal">
                              Permite contaminação
                            </Label>
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
                            "Salvar"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={materialTypes}
                searchKey="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
