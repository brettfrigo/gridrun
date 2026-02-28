"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LANES = 3;
const SPAWN_MS = 850;

export default function GameSite() {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState("Press Start or Space to play");

  const lastSpawn = useRef(0);
  const lastFrame = useRef(0);
  const raf = useRef(null);

  const laneX = useMemo(() => [16.66, 50, 83.33], []);

  const reset = () => {
    setPlayerLane(1);
    setObstacles([]);
    setScore(0);
    setSpeed(1);
    setMessage("Go!");
  };

  const start = () => {
    reset();
    lastSpawn.current = performance.now();
    lastFrame.current = performance.now();
    setRunning(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") setPlayerLane((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") setPlayerLane((p) => Math.min(2, p + 1));
      if (e.key === " " && !running) start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const loop = (ts) => {
      const dt = ts - lastFrame.current;
      lastFrame.current = ts;

      if (ts - lastSpawn.current >= Math.max(260, SPAWN_MS - speed * 120)) {
        lastSpawn.current = ts;
        const lane = Math.floor(Math.random() * LANES);
        setObstacles((prev) => [...prev, { id: crypto.randomUUID(), lane, y: -10 }]);
      }

      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, y: o.y + dt * (0.03 + speed * 0.006) }))
          .filter((o) => o.y < 110)
      );

      setScore((s) => s + Math.floor(dt / 16));
      setSpeed((s) => Math.min(8, s + dt * 0.00006));

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, speed]);

  useEffect(() => {
    if (!running) return;
    const hit = obstacles.some((o) => o.lane === playerLane && o.y > 78 && o.y < 96);
    if (hit) {
      setRunning(false);
      setBest((b) => Math.max(b, score));
      setMessage("Crashed. Press Start to try again.");
    }
  }, [obstacles, playerLane, running, score]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-2xl border border-indigo-500/30 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Interactive game site</p>
          <h1 className="mt-2 text-4xl font-bold">Lane Runner ⚡</h1>
          <p className="mt-2 text-slate-300">Dodge incoming blocks. Use ← → (or A/D). Survive as speed ramps up.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
            <div className="relative h-[520px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "100% 36px" }} />

              {[0, 1, 2].map((lane) => (
                <div key={lane} className="absolute top-0 bottom-0 w-px bg-slate-700/70" style={{ left: `${laneX[lane]}%` }} />
              ))}

              {obstacles.map((o) => (
                <div
                  key={o.id}
                  className="absolute -translate-x-1/2 h-10 w-16 rounded-md bg-rose-500 shadow-lg shadow-rose-500/30"
                  style={{ left: `${laneX[o.lane]}%`, top: `${o.y}%` }}
                />
              ))}

              <div
                className="absolute -translate-x-1/2 h-12 w-16 rounded-lg bg-cyan-400 shadow-xl shadow-cyan-500/30 transition-all"
                style={{ left: `${laneX[playerLane]}%`, bottom: "18px" }}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="text-lg font-semibold">Run stats</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Score" value={score} />
                <Stat label="Best" value={best} />
                <Stat label="Speed" value={`${speed.toFixed(1)}x`} />
                <Stat label="State" value={running ? "Running" : "Idle"} />
              </div>
              <p className="mt-3 text-sm text-slate-300">{message}</p>
              <button onClick={start} className="mt-4 w-full rounded-lg bg-indigo-500 px-3 py-2 font-semibold hover:bg-indigo-400">
                {running ? "Restart" : "Start Game"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
              <h3 className="font-semibold">Controls</h3>
              <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
                <li>Move: ← → or A / D</li>
                <li>Start: Space or button</li>
                <li>Goal: survive as long as possible</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
