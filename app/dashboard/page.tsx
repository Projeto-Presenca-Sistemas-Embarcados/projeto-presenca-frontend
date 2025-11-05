"use client";

// Link not used directly here after refactor
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/use-auth";
import {
  getLessonsByTeacher,
  generateRecurringLessons,
  getStudents,
  addStudentToLesson,
  type Lesson,
  type Student,
} from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Button from "../../components/ui/button";
import StudentsPicker from "../../components/dashboard/StudentsPicker";
import RecurrenceForm from "../../components/dashboard/RecurrenceForm";
import LessonsGrid from "../../components/dashboard/LessonsGrid";

export default function DashboardPage() {
  const { session, loading, error } = useAuth(true);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("10:00");
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  // seleção de alunos para associar às ocorrências
  const [allStudents, setAllStudents] = useState<Student[] | null>(null);
  const [studentsQuery, setStudentsQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<
    Array<string | number>
  >([]);

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecurring((s) => !s)}
          >
            {showRecurring ? "Fechar geração" : "Gerar ocorrências"}
          </Button>
        </div>
      </div>
      {showRecurring && (
        <Card>
          <CardHeader>
            <CardTitle>Gerar ocorrências</CardTitle>
          </CardHeader>
          <CardContent>
            {actionMsg && (
              <div className="mb-3 text-sm text-blue-700 bg-blue-100 p-2 rounded">
                {actionMsg}
              </div>
            )}
            <div className="space-y-2 mb-4">
              <StudentsPicker
                allStudents={allStudents}
                onLoadAll={async () => {
                  if (allStudents !== null) return;
                  try {
                    const list = await getStudents();
                    setAllStudents(list);
                  } catch (err) {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : "Falha ao carregar alunos";
                    setActionMsg(msg);
                  }
                }}
                query={studentsQuery}
                setQuery={setStudentsQuery}
                selectedIds={selectedStudentIds}
                setSelectedIds={(updater) => setSelectedStudentIds(updater)}
              />
            </div>
            <RecurrenceForm
              from={from}
              to={to}
              setFrom={setFrom}
              setTo={setTo}
              subject={subject}
              setSubject={setSubject}
              room={room}
              setRoom={setRoom}
              startHour={startHour}
              setStartHour={setStartHour}
              endHour={endHour}
              setEndHour={setEndHour}
              weekdays={weekdays}
              setWeekdays={setWeekdays}
              onSubmit={async () => {
                setActionMsg(null);
                if (!session?.teacherId) return;
                if (!from || !to) {
                  setActionMsg("Informe o período (de/até).");
                  return;
                }
                if (!weekdays.length) {
                  setActionMsg("Selecione pelo menos um dia da semana.");
                  return;
                }
                if (startHour >= endHour) {
                  setActionMsg("Hora de início deve ser menor que a de fim.");
                  return;
                }
                if (!subject.trim() || !room.trim()) {
                  setActionMsg("Informe o nome da aula e a sala.");
                  return;
                }
                try {
                  const resp = await generateRecurringLessons({
                    room: room.trim(),
                    subject: subject.trim(),
                    teacherId: session.teacherId,
                    from,
                    to,
                    startHour,
                    endHour,
                    weekdays,
                  });
                  const createdLessons = resp.lessons ?? [];
                  let assocSuccess = 0;
                  let assocFail = 0;
                  if (createdLessons.length && selectedStudentIds.length) {
                    for (const l of createdLessons) {
                      const ops = selectedStudentIds
                        .map((id) => allStudents?.find((s) => s.id === id))
                        .filter((s): s is Student => Boolean(s))
                        .map((s) => addStudentToLesson(l.id, s.id));
                      const results = await Promise.allSettled(ops);
                      results.forEach((r) =>
                        r.status === "fulfilled" ? assocSuccess++ : assocFail++
                      );
                    }
                  }
                  setActionMsg(
                    `Criadas: ${resp.createdCount} | Puladas: ${resp.skippedCount}` +
                      (selectedStudentIds.length
                        ? ` | Alunos associados: ${assocSuccess}` +
                          (assocFail ? ` (falhas: ${assocFail})` : "")
                        : "")
                  );
                  const data = await getLessonsByTeacher(session.teacherId);
                  setLessons(data);
                  setSelectedStudentIds([]);
                } catch (e) {
                  const msg =
                    e instanceof Error ? e.message : "Erro ao gerar aulas";
                  setActionMsg(msg);
                }
              }}
            />
          </CardContent>
        </Card>
      )}
      {fetchError && (
        <div className="mb-2 text-sm text-red-700 bg-red-100 p-2 rounded">
          {fetchError}
        </div>
      )}
      <LessonsGrid lessons={lessons} />
    </main>
  );
}
