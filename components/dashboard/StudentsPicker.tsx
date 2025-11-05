"use client";

import Button from "../ui/button";
import { type Student } from "../../lib/api";

type Props = {
  allStudents: Student[] | null;
  onLoadAll: () => Promise<void> | void;
  query: string;
  setQuery: (v: string) => void;
  selectedIds: Array<string | number>;
  setSelectedIds: (
    updater: (prev: Array<string | number>) => Array<string | number>
  ) => void;
};

export default function StudentsPicker({
  allStudents,
  onLoadAll,
  query,
  setQuery,
  selectedIds,
  setSelectedIds,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Adicionar alunos</div>
        <div className="text-xs text-gray-600">
          {selectedIds.length} selecionado(s)
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por nome ou tag"
          className="w-full rounded border px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (allStudents === null) void onLoadAll();
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIds(() => [])}
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
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return (
                  s.name.toLowerCase().includes(q) ||
                  (s.tagId ?? "").toLowerCase().includes(q)
                );
              })
              .map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <label
                    key={String(s.id)}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedIds((prev) =>
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
  );
}
