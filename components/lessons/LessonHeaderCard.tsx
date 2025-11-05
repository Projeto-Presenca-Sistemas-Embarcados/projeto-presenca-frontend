"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Button from "../ui/button";
import { type Lesson } from "../../lib/api";

type Props = {
  lesson: Lesson;
  busy: boolean;
  onToggleOpen: () => void;
  showEdit: boolean;
  onToggleEdit: () => void;
};

export default function LessonHeaderCard({
  lesson,
  busy,
  onToggleOpen,
  showEdit,
  onToggleEdit,
}: Props) {
  return (
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
          <Button onClick={onToggleOpen} disabled={busy} size="sm">
            {lesson.opened ? "Fechar aula" : "Abrir aula"}
          </Button>
          <Button onClick={onToggleEdit} variant="outline" size="sm">
            {showEdit ? "Fechar edição" : "Editar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
