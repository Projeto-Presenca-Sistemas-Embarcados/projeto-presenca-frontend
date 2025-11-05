"use client";

import Button from "../ui/button";
import { type Lesson, type LessonStudent } from "../../lib/api";

type Props = {
  lesson: Lesson | null;
  lessonStudents: LessonStudent[] | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "primary" | "secondary";
  className?: string;
};

function normalizeStudentRow(st: LessonStudent) {
  return {
    id: (st.student?.id as number | string) ?? st.studentId ?? st.id,
    name: (st.student?.name as string) ?? "",
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

export default function AttendanceExportButton({
  lesson,
  lessonStudents,
  label = "Exportar presenças (CSV)",
  size = "sm",
  variant = "outline",
  className,
}: Props) {
  function exportCsv() {
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
    const bom = "\uFEFF"; // ensure UTF-8 detection (Excel)
    const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8;" });
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

  return (
    <Button
      variant={variant}
      size={size}
      onClick={exportCsv}
      className={className}
    >
      {label}
    </Button>
  );
}
