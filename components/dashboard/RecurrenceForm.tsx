"use client";

import Button from "../ui/button";

type Props = {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  room: string;
  setRoom: (v: string) => void;
  startHour: string;
  setStartHour: (v: string) => void;
  endHour: string;
  setEndHour: (v: string) => void;
  weekdays: number[];
  setWeekdays: (updater: (prev: number[]) => number[]) => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export default function RecurrenceForm({
  from,
  to,
  setFrom,
  setTo,
  subject,
  setSubject,
  room,
  setRoom,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  weekdays,
  setWeekdays,
  onSubmit,
  submitLabel = "Gerar",
}: Props) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
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
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
