"use client";

import Link from "next/link";
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
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Adicionar alunos</div>
                <div className="text-xs text-gray-600">
                  {selectedStudentIds.length} selecionado(s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por nome ou tag"
                  className="w-full rounded border px-3 py-2"
                  value={studentsQuery}
                  onChange={(e) => setStudentsQuery(e.target.value)}
                  onFocus={async () => {
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
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentIds([])}
                >
                  Limpar seleção
                </Button>
              </div>
              <div className="max-h-56 overflow-auto border rounded p-2 bg-white">
                {!allStudents || allStudents.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    {allStudents === null
                      ? "Clique no campo para carregar a lista..."
                      : "Nenhum aluno disponível."}
                  </div>
                ) : (
                  <div className="grid gap-1">
                    {allStudents
                      .filter((s) => {
                        const q = studentsQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          s.name.toLowerCase().includes(q) ||
                          (s.tagId ?? "").toLowerCase().includes(q)
                        );
                      })
                      .map((s) => {
                        const checked = selectedStudentIds.includes(s.id);
                        return (
                          <label
                            key={String(s.id)}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedStudentIds((prev) =>
                                  e.target.checked
                                    ? [...new Set([...prev, s.id])]
                                    : prev.filter((id) => id !== s.id)
                                );
                              }}
                            />
                            <span className="font-medium">{s.name}</span>
                            <span className="text-gray-600">
                              {s.tagId ? `(${s.tagId})` : ""}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
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
                  // Se houver alunos selecionados, associar a cada aula criada
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
            >
              <div>
                <label className="block text-sm mb-1">De (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Até (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Nome da aula</label>
                <input
                  type="text"
                  placeholder="Ex.: Matemática"
                  className="w-full rounded border px-3 py-2"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Sala</label>
                <input
                  type="text"
                  placeholder="Ex.: 101"
                  className="w-full rounded border px-3 py-2"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Início (HH:mm)</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fim (HH:mm)</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">Dias da semana</label>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    { v: 0, l: "Dom" },
                    { v: 1, l: "Seg" },
                    { v: 2, l: "Ter" },
                    { v: 3, l: "Qua" },
                    { v: 4, l: "Qui" },
                    { v: 5, l: "Sex" },
                    { v: 6, l: "Sáb" },
                  ].map((d) => (
                    <label
                      key={d.v}
                      className="inline-flex items-center gap-1 border rounded px-2 py-1 bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={weekdays.includes(d.v)}
                        onChange={(e) =>
                          setWeekdays((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, d.v])].sort()
                              : prev.filter((x) => x !== d.v)
                          )
                        }
                      />
                      {d.l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Gerar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
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
                  {l.opened ? (
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
