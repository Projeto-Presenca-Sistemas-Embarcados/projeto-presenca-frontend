"use client";

import { useEffect, useState, useRef } from "react";
import { getLessonLogs, type AttendanceLog } from "../../lib/api";
import { Card, CardContent } from "../ui/card";

interface AttendanceLogsProps {
  lessonId: number;
  enabled?: boolean;
  onNewLog?: () => void;
}

export default function AttendanceLogs({
  lessonId,
  enabled = true,
  onNewLog,
}: AttendanceLogsProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const lastLogCountRef = useRef(0);
  const onNewLogRef = useRef(onNewLog);
  const isFetchingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    onNewLogRef.current = onNewLog;
  }, [onNewLog]);

  useEffect(() => {
    if (!enabled || !lessonId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setLogs([]);
      lastLogCountRef.current = 0;
      return;
    }

    lastLogCountRef.current = 0;
    setLoading(true);

    const fetchLogs = async () => {
      if (isFetchingRef.current) {
        return;
      }

      // Pausar polling se não houve atividade nos últimos 5 minutos e não há logs
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > 5 * 60 * 1000 && lastLogCountRef.current === 0) {
        return;
      }

      isFetchingRef.current = true;
      try {
        const data = await getLessonLogs(lessonId);
        const newLogCount = data.length;

        // Se houver novos logs, atualizar timestamp de atividade
        if (newLogCount > lastLogCountRef.current) {
          lastActivityRef.current = Date.now();
          
          // Chamar callback quando houver novos logs
          if (onNewLogRef.current) {
            onNewLogRef.current();
          }
        }

        setLogs(data);
        lastLogCountRef.current = newLogCount;
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar logs:", error);
        setLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchLogs();
    intervalRef.current = setInterval(fetchLogs, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isFetchingRef.current = false;
    };
  }, [lessonId, enabled]);

  if (!enabled) return null;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Logs de Presença em Tempo Real</h3>
          <div className="text-sm text-gray-500">
            {logs.length} evento{logs.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhum log de presença ainda. Quando um aluno marcar presença via
            RFID, os eventos aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${
                  log.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          log.success ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {log.success ? "✅" : "❌"} {log.studentName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        log.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {log.message}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Tag: {log.tagId}</span>
                      <span>Sala: {log.room}</span>
                      <span>ESP32: {log.esp32Id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

