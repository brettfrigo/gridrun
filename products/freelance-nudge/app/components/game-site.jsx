"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LANES = 3;
const BASE_SPAWN_MS = 700;

export default function GameSite() {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [shield, setShield] = useState(0);
  const [boost, setBoost] = useState(0);
  const [combo, setCombo] = useState(1);
  const [message, setMessage] = useState("ENTER THE GRID — press Start or Space");
  const [dangerFlash, setDangerFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const lastSpawn = useRef(0);
  const lastOrbSpawn = useRef(0);
  const lastFrame = useRef(0);
  const raf = useRef(null);
  const audioCtxRef = useRef(null);

  const laneX = useMemo(() => [16.66, 50, 83.33], []);

  const playBeep = (freq = 440, duration = 0.08, type = "sine", gain = 0.035) => {
    if (!soundOn || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const reset = () => {
    setPlayerLane(1);
    setObstacles([]);
    setOrbs([]);
    setScore(0);
    setSpeed(1);
    setShield(1);
    setBoost(0);
    setCombo(1);
    setDangerFlash(false);
    setMessage("RUNNER ONLINE");
  };

  const start = () => {
    reset();
    const now = performance.now();
    lastSpawn.current = now;
    lastOrbSpawn.current = now;
    lastFrame.current = now;
    setRunning(true);
    playBeep(520, 0.07, "triangle", 0.03);
  };

  useEffect(() => {
    const savedBest = Number(localStorage.getItem("neon-grid-best") || "0");
    if (savedBest > 0) setBest(savedBest);
  }, []);

  useEffect(() => {
    localStorage.setItem("neon-grid-best", String(best));
  }, [best]);

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

      const spawnRate = Math.max(160, BASE_SPAWN_MS - speed * 72 - Math.min(boost, 3) * 70);
      if (ts - lastSpawn.current >= spawnRate) {
        lastSpawn.current = ts;
        const lane = Math.floor(Math.random() * LANES);
        const type = Math.random() < 0.2 ? "wall" : "block";
        setObstacles((prev) => [...prev, { id: crypto.randomUUID(), lane, y: -10, type }]);
      }

      if (ts - lastOrbSpawn.current >= 2200) {
        lastOrbSpawn.current = ts;
        const lane = Math.floor(Math.random() * LANES);
        setOrbs((prev) => [...prev, { id: crypto.randomUUID(), lane, y: -8 }]);
      }

      const velocity = dt * (0.026 + speed * 0.007 + Math.min(boost, 3) * 0.01);
      setObstacles((prev) => prev.map((o) => ({ ...o, y: o.y + velocity })).filter((o) => o.y < 115));
      setOrbs((prev) => prev.map((o) => ({ ...o, y: o.y + velocity * 0.88 })).filter((o) => o.y < 115));

      setScore((s) => s + Math.floor((dt / 16) * (1 + boost * 0.4) * combo));
      setSpeed((s) => Math.min(11, s + dt * 0.000048));
      setBoost((b) => Math.max(0, b - dt * 0.00032));
      setCombo((c) => Math.max(1, c - dt * 0.00011));

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, speed, boost, combo]);

  useEffect(() => {
    if (!running) return;

    const gotOrb = orbs.some((o) => o.lane === playerLane && o.y > 80 && o.y < 96);
    if (gotOrb) {
      setOrbs((prev) => prev.filter((o) => !(o.lane === playerLane && o.y > 80 && o.y < 96)));
      setBoost((b) => Math.min(4.8, b + 1.2));
      setCombo((c) => Math.min(4, c + 0.35));
      setScore((s) => s + 150);
      setMessage("ENERGY ORB COLLECTED ⚡ COMBO UP");
      playBeep(860, 0.06, "triangle", 0.03);
    }

    const nearMiss = obstacles.some((o) => o.lane !== playerLane && o.y > 90 && o.y < 98);
    if (nearMiss) {
      setCombo((c) => Math.min(4.5, c + 0.02));
    }

    const hitObstacle = obstacles.find((o) => o.lane === playerLane && o.y > 78 && o.y < 96);
    if (hitObstacle) {
      if (shield > 0) {
        setShield((s) => s - 1);
        setObstacles((prev) => prev.filter((o) => o.id !== hitObstacle.id));
        setMessage("SHIELD SAVED YOU");
        setDangerFlash(true);
        setTimeout(() => setDangerFlash(false), 140);
        playBeep(180, 0.1, "sawtooth", 0.05);
      } else {
        setRunning(false);
        setBest((b) => Math.max(b, score));
        setMessage("DEREZZED. Press Start to jack back in.");
        setDangerFlash(true);
        playBeep(120, 0.18, "square", 0.06);
      }
    }
  }, [obstacles, orbs, playerLane, running, shield, score]);

  const vibe = boost > 0 ? "from-cyan-900/35 via-fuchsia-900/20 to-indigo-950" : "from-slate-950 via-slate-950 to-indigo-950";
  const tier = speed > 8.5 ? "INSANE" : speed > 6 ? "HARD" : speed > 3.5 ? "NORMAL" : "EASY";

  return (
    <main className="min-h-screen bg-black text-cyan-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl border border-cyan-400/40 bg-slate-950/80 p-6 shadow-[0_0_30px_rgba(34,211,238,.15)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-300">READY PLAYER ONE × TRON</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-cyan-200">NEON GRID RUNNER</h1>
              <p className="mt-2 text-cyan-100/80">Race the light lanes. Dodge corrupt blocks. Harvest energy orbs. Don’t get derezzed.</p>
            </div>
            <button onClick={() => setSoundOn((s) => !s)} className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs">
              {soundOn ? "🔊 Sound On" : "🔈 Sound Off"}
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.25fr_.75fr]">
          <div className={`rounded-2xl border border-cyan-400/40 bg-gradient-to-b ${vibe} p-4 shadow-[0_0_40px_rgba(14,165,233,.18)]`}>
            <div className={`relative h-[540px] overflow-hidden rounded-xl border border-cyan-500/30 bg-[#02030a] ${dangerFlash ? "animate-pulse" : ""}`}>
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(to bottom, rgba(34,211,238,0.2) 1px, transparent 1px)", backgroundSize: "100% 30px" }} />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(to right, rgba(217,70,239,0.2) 1px, transparent 1px)", backgroundSize: "44px 100%" }} />

              {[0, 1, 2].map((lane) => (
                <div key={lane} className="absolute top-0 bottom-0 w-px bg-cyan-400/30" style={{ left: `${laneX[lane]}%` }} />
              ))}

              {obstacles.map((o) => (
                <div
                  key={o.id}
                  className={`absolute -translate-x-1/2 rounded-md ${o.type === "wall" ? "h-12 w-20 bg-fuchsia-500 shadow-fuchsia-500/50" : "h-10 w-16 bg-rose-500 shadow-rose-500/50"} shadow-lg`}
                  style={{ left: `${laneX[o.lane]}%`, top: `${o.y}%` }}
                />
              ))}

              {orbs.map((o) => (
                <div
                  key={o.id}
                  className="absolute -translate-x-1/2 h-6 w-6 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.8)]"
                  style={{ left: `${laneX[o.lane]}%`, top: `${o.y}%` }}
                />
              ))}

              <div
                className="absolute -translate-x-1/2 h-12 w-16 rounded-lg bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,.8)] transition-all"
                style={{ left: `${laneX[playerLane]}%`, bottom: "20px" }}
              />

              {shield > 0 && (
                <div
                  className="absolute -translate-x-1/2 h-16 w-20 rounded-xl border border-cyan-200/70 shadow-[0_0_28px_rgba(34,211,238,.5)]"
                  style={{ left: `${laneX[playerLane]}%`, bottom: "14px" }}
                />
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-3 md:hidden">
              <button onClick={() => setPlayerLane((p) => Math.max(0, p - 1))} className="rounded-lg border border-cyan-400/40 px-4 py-2">◀</button>
              <button onClick={() => setPlayerLane((p) => Math.min(2, p + 1))} className="rounded-lg border border-cyan-400/40 px-4 py-2">▶</button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-fuchsia-400/35 bg-slate-950/90 p-4 shadow-[0_0_24px_rgba(217,70,239,.18)]">
              <h2 className="text-lg font-bold text-fuchsia-200">Run telemetry</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Score" value={score} tone="cyan" />
                <Stat label="Best" value={best} tone="fuchsia" />
                <Stat label="Speed" value={`${speed.toFixed(1)}x`} tone="cyan" />
                <Stat label="Boost" value={`${boost.toFixed(1)}x`} tone="fuchsia" />
                <Stat label="Combo" value={`${combo.toFixed(1)}x`} tone="cyan" />
                <Stat label="Tier" value={tier} tone="fuchsia" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-cyan-200/80">Shield</span>
                <span>{shield > 0 ? "🛡️ Online" : "Offline"}</span>
              </div>
              <p className="mt-3 text-sm text-cyan-100/80">{message}</p>
              <button onClick={start} className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-2 font-bold text-slate-950 hover:brightness-110">
                {running ? "Reboot Run" : "Start Run"}
              </button>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4">
              <h3 className="font-semibold text-cyan-200">Controls</h3>
              <ul className="mt-2 text-sm text-cyan-100/80 list-disc list-inside space-y-1">
                <li>Move: ← → or A / D</li>
                <li>Start: Space or button</li>
                <li>Collect cyan orbs for boost + combo</li>
                <li>Near misses grow combo slowly</li>
                <li>Shield blocks one collision</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, tone = "cyan" }) {
  const cls = tone === "fuchsia"
    ? "border-fuchsia-400/35 bg-fuchsia-900/10 text-fuchsia-100"
    : "border-cyan-400/35 bg-cyan-900/10 text-cyan-100";

  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
