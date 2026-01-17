"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: Include cookies
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      
      // Force a hard navigation to ensure cookies are properly set
      window.location.href = "/pontos-coleta";
    } catch {
      toast.error("Erro ao conectar com o servidor");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center">
          <Recycle className="w-9 h-9 text-emerald-500" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-zinc-100">EcoColeta</CardTitle>
          <CardDescription className="text-zinc-400">
            Sistema de Coleta de Resíduos
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <p className="text-xs text-zinc-400 font-medium mb-2">Credenciais de teste:</p>
          <div className="space-y-1 text-xs text-zinc-500">
            <p>Admin: <span className="text-zinc-300">admin@ecorecicla.com</span></p>
            <p>Senha: <span className="text-zinc-300">admin123</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
