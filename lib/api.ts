export type LoginInput = { email: string; password: string };
export type LoginResponse = {
  message: string;
  isAuthenticated: boolean;
  email?: string;
  redirectTo?: string;
};

// Domain types (best-effort based on API docs)
export type Teacher = {
  id: number;
  name: string;
  email: string;
  tagId?: string;
  startTime?: string;
};

export type Lesson = {
  id: number;
  room: string;
  subject: string;
  teacherId: number;
  startTime: string;
  endTime: string;
  opened?: boolean; // assumido pelo fluxo de open/close
};

export type LessonStudent = {
  id: number;
  lessonId: number;
  studentId: number;
  present?: boolean;
  tagId?: string;
  student: {
    id: number;
    name: string;
    tagId?: string;
  };
};

// Students (lista geral)
export type Student = {
  id: number | string;
  name: string;
  tagId?: string;
};

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...opts,
  });
  const payload: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : undefined) || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Teachers
export async function getTeachers(): Promise<Teacher[]> {
  return request<Teacher[]>("/teachers", { method: "GET" });
}

export async function findTeacherByEmail(
  email: string
): Promise<Teacher | null> {
  const all = await getTeachers();
  return all.find((t) => t.email.toLowerCase() === email.toLowerCase()) ?? null;
}

// Lessons
export async function getLessonsByTeacher(
  teacherId: number
): Promise<Lesson[]> {
  return request<Lesson[]>(`/lessons/teacher/${teacherId}`, { method: "GET" });
}

export async function getLesson(id: number): Promise<Lesson> {
  return request<Lesson>(`/lessons/${id}`, { method: "GET" });
}

export async function getLessonStudents(id: number): Promise<LessonStudent[]> {
  return request<LessonStudent[]>(`/lessons/${id}/students`, { method: "GET" });
}

export async function openLesson(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/lessons/${id}/open`, {
    method: "POST",
  });
}

export async function closeLesson(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/lessons/${id}/close`, {
    method: "POST",
  });
}

export async function markAttendance(
  lessonId: number,
  studentId: number,
  present: boolean
): Promise<{ message?: string } | Record<string, unknown>> {
  return request(`/lessons/${lessonId}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, present }),
  });
}

export async function markAttendanceByTag(
  lessonId: number,
  tagId: string
): Promise<{ message?: string } | Record<string, unknown>> {
  return request(`/lessons/${lessonId}/attendance-tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagId }),
  });
}

export async function getStudents(): Promise<Student[]> {
  return request<Student[]>(`/students`, { method: "GET" });
}

// Update/Delete de aulas (assumindo API REST padrão)
export async function updateLesson(
  id: number,
  payload: Partial<Pick<Lesson, "room" | "subject" | "startTime" | "endTime">>
): Promise<Lesson> {
  return request<Lesson>(`/lessons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteLesson(
  id: number
): Promise<{ message?: string } | Record<string, unknown>> {
  return request(`/lessons/${id}`, {
    method: "DELETE",
  });
}

// Recorrência de aulas
export type GenerateRecurringInput = {
  room: string;
  subject: string;
  teacherId: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  weekdays: number[]; // 0..6
};

export type GenerateRecurringResponse = {
  createdCount: number;
  skippedCount: number;
  lessons?: Lesson[];
};

export async function generateRecurringLessons(
  input: GenerateRecurringInput
): Promise<GenerateRecurringResponse> {
  return request<GenerateRecurringResponse>(`/lessons/recurring/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Associar/Remover alunos em uma aula
export async function addStudentToLesson(
  lessonId: number,
  studentId: number | string
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/lessons/${lessonId}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  });
}

export async function removeStudentFromLesson(
  lessonId: number,
  studentId: number | string
): Promise<{ success?: boolean } | Record<string, unknown>> {
  return request(`/lessons/${lessonId}/students/${studentId}`, {
    method: "DELETE",
  });
}

// Logs de presença
export type AttendanceLog = {
  id: string;
  lessonId: number;
  studentId: number;
  studentName: string;
  tagId: string;
  room: string;
  esp32Id: string;
  success: boolean;
  message: string;
  timestamp: string;
};

export async function getLessonLogs(
  lessonId: number
): Promise<AttendanceLog[]> {
  return request<AttendanceLog[]>(`/lessons/${lessonId}/logs`, {
    method: "GET",
  });
}

export async function clearLessonLogs(
  lessonId: number
): Promise<{ message: string }> {
  return request<{ message: string }>(`/lessons/${lessonId}/logs`, {
    method: "DELETE",
  });
}
