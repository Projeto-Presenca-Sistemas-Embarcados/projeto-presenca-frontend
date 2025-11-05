"use client";

import Button from "../ui/button";

type Props = {
  subject: string;
  room: string;
  onChangeSubject: (v: string) => void;
  onChangeRoom: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  busy: boolean;
  editMsg?: string | null;
};

export default function LessonEditForm({
  subject,
  room,
  onChangeSubject,
  onChangeRoom,
  onSave,
  onDelete,
  busy,
  editMsg,
}: Props) {
  return (
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
            value={subject}
            onChange={(e) => onChangeSubject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Sala</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={room}
            onChange={(e) => onChangeRoom(e.target.value)}
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <Button onClick={onSave} disabled={busy}>
            Salvar alterações
          </Button>
          <Button onClick={onDelete} disabled={busy} variant="outline">
            Excluir aula
          </Button>
        </div>
      </div>
    </div>
  );
}
