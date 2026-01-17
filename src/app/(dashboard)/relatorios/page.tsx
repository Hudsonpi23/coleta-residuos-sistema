"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Loader2,
  Scale,
  TrendingUp,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface ReportSummary {
  period: { from: string | null; to: string | null };
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

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);

      const res = await fetch(`/api/reports/summary?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <>
      <Header
        title="Relatórios"
        description="Análise de desempenho e métricas operacionais"
      />
      <PageContainer>
        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Data Inicial</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 w-40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Data Final</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 w-40"
                />
              </div>
              <Button
                onClick={fetchReport}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Total Coletado</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data.collection.totalCollectedKg.toLocaleString("pt-BR")} kg
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
                      <p className="text-sm text-zinc-400">Rotas Realizadas</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data.collection.completedRuns}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
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
                        {data.collection.completionRate}%
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
                      <p className="text-sm text-zinc-400">Estoque Atual</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data.stock.totalAvailableKg.toLocaleString("pt-BR")} kg
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-500" />
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
                </CardHeader>
                <CardContent>
                  {data.collectedByMaterial.length > 0 ? (
                    <div className="space-y-4">
                      {data.collectedByMaterial.map((item, index) => (
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
                    <p className="text-zinc-500 text-center py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Team Productivity */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Produtividade por Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.teamProductivity.length > 0 ? (
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
                          <span className="font-semibold text-emerald-400">
                            {team.totalKg.toLocaleString("pt-BR")} kg
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-center py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collection Stats */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Estatísticas de Coleta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-zinc-400">Coletadas</span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data.collection.completedStops}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-zinc-400">Não Coletadas</span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">
                        {data.collection.skippedStops}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skip Reasons */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Motivos de Não Coleta</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.skipReasons.length > 0 ? (
                    <div className="space-y-3">
                      {data.skipReasons.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                        >
                          <span className="text-sm text-zinc-300">{item.reason}</span>
                          <span className="font-medium text-zinc-200">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-center py-8">
                      Nenhuma coleta cancelada
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </PageContainer>
    </>
  );
}
