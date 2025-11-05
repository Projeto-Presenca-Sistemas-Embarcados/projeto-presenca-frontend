"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getLesson,
  getLessonStudents,
  openLesson,
  closeLesson,
  markAttendance,
  type Lesson,
  type LessonStudent,
} from "../../../lib/api";
import { useAuth } from "../../../lib/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button";

export default function LessonDetailPage() {
  const { session, loading, error } = useAuth(true);
  const params = useParams();
  const lessonId = useMemo(() => Number(params?.id), [params]);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<LessonStudent[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (!lessonId || Number.isNaN(lessonId)) return;
    if (!session) return;
    (async () => {
      try {
        const [l, s] = await Promise.all([
          getLesson(lessonId),
          getLessonStudents(lessonId),
        ]);
        setLesson(l);
        setStudents(s);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar aula";
        setFetchError(msg);
      }
    })();
  }, [lessonId, session]);

  async function handleOpenClose() {
    if (!lesson) return;
    setBusy(true);
    try {
      if (lesson.isOpen) {
        await closeLesson(lesson.id);
        setLesson({ ...lesson, isOpen: false });
      } else {
        await openLesson(lesson.id);
        setLesson({ ...lesson, isOpen: true });
      }
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Erro ao alterar status da aula"
      );
    } finally {
      setBusy(false);
    }
  }

  async function togglePresence(student: LessonStudent) {
    if (!lesson) return;
    const newValue = !student.present;
    setStudents(
      (prev) =>
        prev?.map((s) =>
          s.id === student.id ? { ...s, present: newValue } : s
        ) ?? null
    );
    try {
      await markAttendance(lesson.id, student.id, newValue);
    } catch (e) {
      // rollback
      setStudents(
        (prev) =>
          prev?.map((s) =>
            s.id === student.id ? { ...s, present: !newValue } : s
          ) ?? null
      );
      setFetchError(e instanceof Error ? e.message : "Erro ao marcar presença");
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aula</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
      {fetchError && (
        <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
          {fetchError}
        </div>
      )}

      {!lesson ? (
        <Card>
          <CardContent>
            <p className="text-gray-700">Aula não encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {lesson.subject} — {lesson.room}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {new Date(lesson.startTime).toLocaleString()} —{" "}
              {new Date(lesson.endTime).toLocaleString()}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span>
                Status:{" "}
                {lesson.isOpen ? (
                  <span className="text-green-700">Aberta</span>
                ) : (
                  <span className="text-gray-700">Fechada</span>
                )}
              </span>
              <Button onClick={handleOpenClose} disabled={busy} size="sm">
                {lesson.isOpen ? "Fechar aula" : "Abrir aula"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xl font-medium">Alunos</h2>
        {!students || students.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-gray-700">Nenhum aluno nesta aula.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {students.map((st) => (
              <Card key={st.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{st.name}</div>
                      <div className="text-sm text-gray-600">
                        {st.tagId ? `TAG: ${st.tagId}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          st.present ? "text-green-700" : "text-gray-700"
                        }
                      >
                        {st.present ? "Presente" : "Falta"}
                      </span>
                      <Button
                        onClick={() => togglePresence(st)}
                        variant="outline"
                        size="sm"
                      >
                        {st.present ? "Marcar falta" : "Marcar presença"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
