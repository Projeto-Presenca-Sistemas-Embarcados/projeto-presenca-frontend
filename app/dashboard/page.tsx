"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/use-auth";
import { getLessonsByTeacher, type Lesson } from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Button from "../../components/ui/button";

export default function DashboardPage() {
  const { session, loading, error } = useAuth(true);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!session?.teacherId) return;
      try {
        const data = await getLessonsByTeacher(session.teacherId);
        setLessons(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar aulas";
        setFetchError(msg);
      }
    })();
  }, [session?.teacherId]);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Minhas Aulas</h1>
        <div className="text-sm text-gray-600">Bem-vindo(a)!</div>
      </div>
      {fetchError && (
        <div className="mb-2 text-sm text-red-700 bg-red-100 p-2 rounded">
          {fetchError}
        </div>
      )}
      {!lessons || lessons.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-700">Nenhuma aula encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lessons.map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <CardTitle>
                  {l.subject} — {l.room}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {new Date(l.startTime).toLocaleString()} —{" "}
                  {new Date(l.endTime).toLocaleString()}
                </div>
                <div className="text-sm mt-2">
                  Status:{" "}
                  {l.isOpen ? (
                    <span className="text-green-700">Aberta</span>
                  ) : (
                    <span className="text-gray-700">Fechada</span>
                  )}
                </div>
                <div className="mt-4">
                  <Link href={`/lessons/${l.id}`}>
                    <Button size="sm">Ver detalhes</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
