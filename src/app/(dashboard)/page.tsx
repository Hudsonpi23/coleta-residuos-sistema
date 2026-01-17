"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Scale,
  TrendingUp,
  Users,
  MapPin
} from "lucide-react";

interface ReportSummary {
  collection: {
    totalRuns: number;
    completedRuns: number;
    totalStops: number;
    completedStops: number;
    skippedStops: number;
    completionRate: number;
    totalCollectedKg: number;
  };
  collectedByMaterial: Array<{
    name: string;
    category: string | null;
    totalKg: number;
  }>;
  teamProductivity: Array<{
    name: string;
    runs: number;
    stopsCompleted: number;
    totalKg: number;
  }>;
  stock: {
    totalAvailableKg: number;
  };
  skipReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/reports/summary");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Header 
        title="Dashboard" 
        description="Visão geral das operações de coleta"
      />
      <PageContainer>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-zinc-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Total Coletado</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data?.collection.totalCollectedKg.toLocaleString("pt-BR")} kg
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                      <Scale className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Estoque Disponível</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data?.stock.totalAvailableKg.toLocaleString("pt-BR")} kg
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data?.collection.completionRate}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-600/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Rotas Realizadas</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data?.collection.completedRuns} / {data?.collection.totalRuns}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collected by Material */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Coleta por Material</CardTitle>
                  <CardDescription>Volume coletado por tipo de material</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.collectedByMaterial && data.collectedByMaterial.length > 0 ? (
                    <div className="space-y-4">
                      {data.collectedByMaterial.slice(0, 6).map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-zinc-300">
                                {item.name}
                              </span>
                              <span className="text-sm text-zinc-400">
                                {item.totalKg.toLocaleString("pt-BR")} kg
                              </span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (item.totalKg / (data.collectedByMaterial[0]?.totalKg || 1)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                      <Package className="w-12 h-12 mb-2 opacity-50" />
                      <p>Nenhuma coleta registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Productivity */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Produtividade por Equipe</CardTitle>
                  <CardDescription>Desempenho das equipes de coleta</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.teamProductivity && data.teamProductivity.length > 0 ? (
                    <div className="space-y-4">
                      {data.teamProductivity.map((team, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                              <Users className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-200">{team.name}</p>
                              <p className="text-xs text-zinc-500">
                                {team.runs} rotas • {team.stopsCompleted} paradas
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                            {team.totalKg.toLocaleString("pt-BR")} kg
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                      <Users className="w-12 h-12 mb-2 opacity-50" />
                      <p>Nenhuma equipe com coletas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Collection Stats */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Status das Coletas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-zinc-300">Coletadas</span>
                      </div>
                      <span className="text-lg font-semibold text-zinc-100">
                        {data?.collection.completedStops}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-zinc-300">Não coletadas</span>
                      </div>
                      <span className="text-lg font-semibold text-zinc-100">
                        {data?.collection.skippedStops}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <span className="text-zinc-300">Total de paradas</span>
                      </div>
                      <span className="text-lg font-semibold text-zinc-100">
                        {data?.collection.totalStops}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skip Reasons */}
              <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Motivos de Não Coleta</CardTitle>
                  <CardDescription>Por que algumas coletas não foram realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.skipReasons && data.skipReasons.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {data.skipReasons.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                        >
                          <span className="text-sm text-zinc-300 truncate">
                            {item.reason}
                          </span>
                          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                      <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
                      <p>Nenhuma coleta cancelada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
