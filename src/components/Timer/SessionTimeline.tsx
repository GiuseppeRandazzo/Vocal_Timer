import React from "react";
import { ChevronRight } from "lucide-react";
import { useSessionStore } from "../../store/useSessionStore";
import { useTimerStore } from "../../store/useTimerStore";
import { cn, formatTime, pad2 } from "../../lib/ui";

interface SessionTimelineProps {
  onManage: () => void;
}

/**
 * Timeline della scaletta in stile DAW: ogni take è un segmento proporzionale
 * alla sua durata; quello corrente si riempie in tempo reale.
 */
export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  onManage,
}) => {
  const { activeQueue, currentQueueIndex, setCurrentQueueIndex } =
    useSessionStore();
  const { timeLeft, duration, initExercise } = useTimerStore();

  const total = activeQueue.reduce((acc, ex) => acc + ex.durationSeconds, 0);
  const currentProgress = duration > 0 ? 1 - timeLeft / duration : 0;

  return (
    <section
      className="panel px-5 py-4 sm:px-6"
      aria-label="Scaletta della sessione">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="silk text-ink-400">Scaletta</span>
          <span className="h-3 w-px bg-ink-700" />
          <span className="silk">
            {pad2(activeQueue.length)} take · {formatTime(total)} totali
          </span>
        </div>
        <button
          onClick={onManage}
          className="btn btn-quiet -mr-2 px-2 py-1 text-xs">
          Gestisci scaletta <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {activeQueue.length === 0 ? (
        <p className="py-3 text-sm text-ink-500">La scaletta è vuota.</p>
      ) : (
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {activeQueue.map((ex, idx) => {
            const done = idx < currentQueueIndex;
            const current = idx === currentQueueIndex;
            const fill = done
              ? 100
              : current
                ? Math.max(0, Math.min(100, currentProgress * 100))
                : 0;
            return (
              <button
                key={`${ex.id}-${idx}`}
                onClick={() => {
                  setCurrentQueueIndex(idx);
                  initExercise(ex);
                }}
                style={{ flexGrow: ex.durationSeconds, flexBasis: 0 }}
                className="group min-w-[92px] rounded-md p-1.5 text-left transition-colors hover:bg-ink-850 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                title={ex.title}
                aria-current={current ? "step" : undefined}>
                <div className="relative h-2 overflow-hidden rounded-[3px] bg-ink-800">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-1000 ease-linear",
                      current
                        ? "bg-signal shadow-[0_0_12px_rgba(0,242,254,0.6)]"
                        : "bg-ink-500",
                    )}
                    style={{ width: `${fill}%` }}
                  />
                  {current && (
                    <div className="absolute inset-0 rounded-[3px] ring-1 ring-inset ring-signal/40" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      current ? "text-signal" : "text-ink-600",
                    )}>
                    {pad2(idx + 1)}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12px]",
                      current
                        ? "text-ink-100"
                        : done
                          ? "text-ink-500"
                          : "text-ink-400 group-hover:text-ink-200",
                    )}>
                    {ex.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
