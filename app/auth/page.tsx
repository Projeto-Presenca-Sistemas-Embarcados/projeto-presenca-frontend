"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login } from "../../lib/api";
import { setAuthSession } from "../../lib/auth-storage";
import Input from "../../components/ui/input";
import Button from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const data = await login(values);
      // Login bem-sucedido: persiste sessão simples e redireciona
      if (data.isAuthenticated !== true) {
        setServerError(data.message || "Credenciais inválidas");
        setIsSubmitting(false);
        return;
      }
      const teacherEmail = data.email ?? values.email;
      setAuthSession({ email: teacherEmail, isAuthenticated: true });
      router.push(data.redirectTo || "/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao conectar ao servidor";
      setServerError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login — Professores</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="email"
              label="E-mail"
              placeholder="seu@escola.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              type="password"
              label="Senha"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
