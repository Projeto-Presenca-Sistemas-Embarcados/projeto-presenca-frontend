"use client";

import Link from "next/link";
import { type Lesson } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Button from "../ui/button";

type Props = {
  lessons: Lesson[] | null;
};

export default function LessonsGrid({ lessons }: Props) {
  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-700">Nenhuma aula encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
}
