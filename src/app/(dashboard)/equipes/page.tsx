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
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

interface TeamMember {
  id: string;
  role: string | null;
  employee: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  _count: {
    routeAssignments: number;
  };
}

export default function TeamsPage() {
  const { hasPermission } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  const canCreate = hasPermission("teams:create");
  const canUpdate = hasPermission("teams:update");
  const canDelete = hasPermission("teams:delete");

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (json.success) {
        setTeams(json.data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Erro ao carregar equipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTeam
        ? `/api/teams/${editingTeam.id}`
        : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";

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

      toast.success(editingTeam ? "Equipe atualizada!" : "Equipe criada!");
      setDialogOpen(false);
      setEditingTeam(null);
      resetForm();
      fetchTeams();
    } catch {
      toast.error("Erro ao salvar equipe");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta equipe?")) return;

    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir");
        return;
      }

      toast.success("Equipe excluída!");
      fetchTeams();
    } catch {
      toast.error("Erro ao excluir equipe");
    }
  };

  const resetForm = () => {
    setFormData({ name: "" });
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "members",
      header: "Membros",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.members.length === 0 ? (
            <span className="text-zinc-500">Nenhum membro</span>
          ) : (
            row.original.members.slice(0, 3).map((member) => (
              <Badge
                key={member.id}
                variant="outline"
                className="bg-zinc-800 border-zinc-700"
              >
                {member.employee.name}
                {member.role && (
                  <span className="ml-1 text-zinc-500">({member.role})</span>
                )}
              </Badge>
            ))
          )}
          {row.original.members.length > 3 && (
            <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
              +{row.original.members.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "_count.routeAssignments",
      header: "Agendamentos",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
          {row.original._count.routeAssignments}
        </Badge>
      ),
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
        title="Equipes"
        description="Gerencie as equipes de coleta"
      >
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTeam(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  {editingTeam ? "Editar Equipe" : "Nova Equipe"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da equipe
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
            data={teams}
            searchKey="name"
            searchPlaceholder="Buscar por nome..."
          />
        )}
      </PageContainer>
    </>
  );
}
