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
import { Card, CardContent } from "../../../components/ui/card";
// Button not used directly here; used within child components
import LessonHeaderCard from "../../../components/lessons/LessonHeaderCard";
import LessonEditForm from "../../../components/lessons/LessonEditForm";
import AttendanceList from "../../../components/lessons/AttendanceList";
import AttendanceExportButton from "../../../components/lessons/AttendanceExportButton";

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

  // CSV export moved into AttendanceExportButton component

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
        <LessonHeaderCard
          lesson={lesson}
          busy={busy}
          onToggleOpen={handleOpenClose}
          showEdit={showEdit}
          onToggleEdit={() => setShowEdit((v) => !v)}
        />
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Alunos</h2>
          <div className="flex items-center gap-2">
            <AttendanceExportButton
              lesson={lesson}
              lessonStudents={lessonStudents}
              size="sm"
              variant="outline"
              className="mb-2"
            />
          </div>
        </div>
        <AttendanceList items={lessonStudents} onToggle={togglePresence} />
      </section>

      {showEdit && (
        <LessonEditForm
          subject={subjectEdit}
          room={roomEdit}
          onChangeSubject={setSubjectEdit}
          onChangeRoom={setRoomEdit}
          onSave={handleSaveEdits}
          onDelete={handleDelete}
          busy={busy}
          editMsg={editMsg}
        />
      )}
    </main>
  );
}
