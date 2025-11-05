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
  updateLesson,
  deleteLesson,
  type Lesson,
  type LessonStudent,
} from "../../../lib/api";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const lessonId = useMemo(() => Number(params?.id), [params]);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  // LessonStudent holds attendance + nested student data
  const [lessonStudents, setLessonStudents] = useState<LessonStudent[] | null>(
    null
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [subjectEdit, setSubjectEdit] = useState("");
  const [roomEdit, setRoomEdit] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  function normalizeStudentRow(st: LessonStudent) {
    return {
      // Prefer nested student id; fall back to potential linkage fields
      id: (st.student?.id as number | string) ?? st.studentId ?? st.id,
      name: (st.student?.name as string) ?? "",
      tagId: st.student?.tagId ?? st.tagId,
      present: st.present ?? false,
    };
  }

  function formatYmd(dateStr?: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function exportAttendanceCsv() {
    if (!lessonStudents || lessonStudents.length === 0) return;
    const headers = ["id", "name", "status"];
    const lines = [headers.join(",")];
    const rows = lessonStudents.map(normalizeStudentRow);
    for (const s of rows) {
      const row = [
        String(s.id).replace(/[\,\n]/g, " "),
        String(s.name).replace(/[\,\n]/g, " "),
        s.present ? "Presente" : "Falta",
      ];
      lines.push(row.join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presencas-aula-${lesson?.subject}-${formatYmd(
      lesson?.startTime
    )}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
        setLessonStudents(s);
        setSubjectEdit(l.subject ?? "");
        setRoomEdit(l.room ?? "");
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
      if (lesson.opened) {
        await closeLesson(lesson.id);
        setLesson({ ...lesson, opened: false });
      } else {
        await openLesson(lesson.id);
        setLesson({ ...lesson, opened: true });
      }
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Erro ao alterar status da aula"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdits() {
    if (!lesson) return;
    setBusy(true);
    setEditMsg(null);
    try {
      const updated = await updateLesson(lesson.id, {
        subject: subjectEdit.trim(),
        room: roomEdit.trim(),
      });
      setLesson(updated);
      setEditMsg("Alterações salvas.");
    } catch (e) {
      setEditMsg(e instanceof Error ? e.message : "Erro ao salvar alterações");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!lesson) return;
    const ok = window.confirm("Tem certeza que deseja excluir esta aula?");
    if (!ok) return;
    setBusy(true);
    setEditMsg(null);
    try {
      await deleteLesson(lesson.id);
      router.push("/dashboard");
    } catch (e) {
      setEditMsg(e instanceof Error ? e.message : "Erro ao excluir aula");
    } finally {
      setBusy(false);
    }
  }

  async function togglePresence(ls: LessonStudent) {
    if (!lesson) return;
    const newValue = !ls.present;
    // optimistic update by nested student id
    setLessonStudents(
      (prev) =>
        prev?.map((s) =>
          s.student.id === ls.student.id ? { ...s, present: newValue } : s
        ) ?? null
    );
    try {
      await markAttendance(lesson.id, ls.student.id, newValue);
    } catch (e) {
      // rollback using the same identity (nested student id)
      setLessonStudents(
        (prev) =>
          prev?.map((s) =>
            s.student.id === ls.student.id ? { ...s, present: !newValue } : s
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
                {lesson.opened ? (
                  <span className="text-green-700">Aberta</span>
                ) : (
                  <span className="text-gray-700">Fechada</span>
                )}
              </span>
              <Button onClick={handleOpenClose} disabled={busy} size="sm">
                {lesson.opened ? "Fechar aula" : "Abrir aula"}
              </Button>
              <Button
                onClick={() => setShowEdit((v) => !v)}
                variant="outline"
                size="sm"
              >
                {showEdit ? "Fechar edição" : "Editar"}
              </Button>
            </div>
            {showEdit && (
              <div className="mt-4 space-y-2">
                {editMsg && (
                  <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                    {editMsg}
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm mb-1">Nome da aula</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={subjectEdit}
                      onChange={(e) => setSubjectEdit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Sala</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={roomEdit}
                      onChange={(e) => setRoomEdit(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <Button onClick={handleSaveEdits} disabled={busy}>
                      Salvar alterações
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={busy}
                      variant="outline"
                    >
                      Excluir aula
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Alunos</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportAttendanceCsv}>
              Exportar presenças (CSV)
            </Button>
          </div>
        </div>
        {!lessonStudents || lessonStudents.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-gray-700">Nenhum aluno nesta aula.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lessonStudents.map((st) => (
              <Card key={st.student.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{st.student.name}</div>
                      <div className="text-sm text-gray-600">
                        {st.student.tagId ? `TAG: ${st.student.tagId}` : ""}
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
