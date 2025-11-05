"use client";

import { type LessonStudent } from "../../lib/api";
import { Card, CardContent } from "../ui/card";
import Button from "../ui/button";

type Props = {
  items: LessonStudent[] | null;
  onToggle: (ls: LessonStudent) => void;
};

export default function AttendanceList({ items, onToggle }: Props) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-700">Nenhum aluno nesta aula.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((st) => (
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
                  className={st.present ? "text-green-700" : "text-gray-700"}
                >
                  {st.present ? "Presente" : "Falta"}
                </span>
                <Button
                  onClick={() => onToggle(st)}
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
  );
}
