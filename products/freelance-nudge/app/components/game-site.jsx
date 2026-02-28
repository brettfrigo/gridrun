"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LANES = 3;
const BASE_SPAWN_MS = 700;
const BOSS_EVERY_MS = 30000;
const LEADERBOARD_KEY = "neon-grid-leaderboard";
const SKIN_KEY = "neon-grid-skin";
const STREAK_KEY = "neon-grid-streak";

const SKINS = [
  { id: "cyan", name: "Cyan Core", unlock: 0, player: "bg-cyan-400", glow: "shadow-[0_0_24px_rgba(34,211,238,.8)]" },
  { id: "violet", name: "Violet Flux", unlock: 1500, player: "bg-violet-400", glow: "shadow-[0_0_24px_rgba(167,139,250,.85)]" },
  { id: "amber", name: "Amber Bolt", unlock: 3500, player: "bg-amber-400", glow: "shadow-[0_0_24px_rgba(251,191,36,.85)]" },
  { id: "rose", name: "Rose Phantom", unlock: 6000, player: "bg-rose-400", glow: "shadow-[0_0_24px_rgba(251,113,133,.85)]" }
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
};
const mulberry32 = (a) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export default function GameSite() {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [dailyBest, setDailyBest] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [shield, setShield] = useState(0);
  const [boost, setBoost] = useState(0);
  const [combo, setCombo] = useState(1);
  const [orbCount, setOrbCount] = useState(0);
  const [bossesCleared, setBossesCleared] = useState(0);
  const [missionRewarded, setMissionRewarded] = useState(false);
  const [mode, setMode] = useState("classic");
  const [message, setMessage] = useState("ENTER THE GRID — press Start or Space");
  const [dangerFlash, setDangerFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [bossMode, setBossMode] = useState(false);
  const [nextBossIn, setNextBossIn] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState("cyan");
  const [runStreak, setRunStreak] = useState(0);
  const [peakCombo, setPeakCombo] = useState(1);
  const [lastRun, setLastRun] = useState(null);
  const [roadOffset, setRoadOffset] = useState(0);
  const [comboBurst, setComboBurst] = useState(false);

  const lastSpawn = useRef(0);
  const lastOrbSpawn = useRef(0);
  const lastFrame = useRef(0);
  const runStart = useRef(0);
  const bossUntil = useRef(0);
  const rngRef = useRef(Math.random);
  const raf = useRef(null);
  const audioCtxRef = useRef(null);

  const laneX = useMemo(() => [16.66, 50, 83.33], []);
  const skin = SKINS.find((s) => s.id === selectedSkin) || SKINS[0];

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

  const random = () => (mode === "daily" ? rngRef.current() : Math.random());

  const saveScore = (finalScore) => {
    if (finalScore <= 0) return;

    const current = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    const qualifies = current.length < 5 || finalScore > current[current.length - 1].score;
    if (!qualifies) return;

    const savedInitials = (localStorage.getItem("neon-grid-initials") || "YOU")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3) || "YOU";

    const next = [...current, { name: savedInitials, score: finalScore }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
    setLeaderboard(next);
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
    setPeakCombo(1);
    setOrbCount(0);
    setBossesCleared(0);
    setMissionRewarded(false);
    setDangerFlash(false);
    setComboBurst(false);
    setRoadOffset(0);
    setBossMode(false);
    setNextBossIn(30);
    setMessage(mode === "daily" ? "DAILY CHALLENGE ACTIVE" : "RUNNER ONLINE");
  };

  const start = () => {
    reset();
    const now = performance.now();
    runStart.current = now;
    bossUntil.current = 0;
    lastSpawn.current = now;
    lastOrbSpawn.current = now;
    lastFrame.current = now;
    rngRef.current = mulberry32(hashString(todayKey()));
    setPaused(false);
    setRunning(true);
    playBeep(520, 0.07, "triangle", 0.03);
  };

  useEffect(() => {
    const savedBest = Number(localStorage.getItem("neon-grid-best") || "0");
    if (savedBest > 0) setBest(savedBest);
    setLeaderboard(JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"));
    setDailyBest(Number(localStorage.getItem(`neon-grid-daily-${todayKey()}`) || "0"));

    const skinSaved = localStorage.getItem(SKIN_KEY) || "cyan";
    setSelectedSkin(skinSaved);
    setRunStreak(Number(localStorage.getItem(STREAK_KEY) || "0"));
  }, []);

  useEffect(() => {
    localStorage.setItem("neon-grid-best", String(best));
  }, [best]);

  useEffect(() => {
    localStorage.setItem(SKIN_KEY, selectedSkin);
  }, [selectedSkin]);

  useEffect(() => {
    localStorage.setItem(STREAK_KEY, String(runStreak));
  }, [runStreak]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") setPlayerLane((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") setPlayerLane((p) => Math.min(2, p + 1));
      if (e.key.toLowerCase() === "p" && running) {
        setPaused((v) => !v);
        setMessage((m) => (m === "PAUSED" ? "RUNNER ONLINE" : "PAUSED"));
      }
      if (e.key === " " && !running) start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, mode]);

  useEffect(() => {
    if (!running) return;

    const loop = (ts) => {
      if (paused) {
        lastFrame.current = ts;
        raf.current = requestAnimationFrame(loop);
        return;
      }

      const dt = ts - lastFrame.current;
      lastFrame.current = ts;

      const elapsed = ts - runStart.current;
      const inBoss = ts < bossUntil.current;

      if (!inBoss && elapsed > 0 && Math.floor(elapsed / BOSS_EVERY_MS) > Math.floor((elapsed - dt) / BOSS_EVERY_MS)) {
        bossUntil.current = ts + 7000;
        setBossMode(true);
        setMessage("BOSS WAVE INCOMING ☠️");
        playBeep(140, 0.2, "sawtooth", 0.06);
      }
      if (inBoss && ts >= bossUntil.current) {
        setBossMode(false);
        setBossesCleared((b) => b + 1);
        setMessage("Boss wave cleared. Keep running.");
      }

      const spawnRate = inBoss
        ? Math.max(95, BASE_SPAWN_MS - speed * 95)
        : Math.max(160, BASE_SPAWN_MS - speed * 72 - Math.min(boost, 3) * 70);

      if (ts - lastSpawn.current >= spawnRate) {
        lastSpawn.current = ts;

        if (inBoss && random() < 0.55) {
          const gap = Math.floor(random() * LANES);
          const wave = [0, 1, 2].filter((l) => l !== gap).map((lane) => ({ id: crypto.randomUUID(), lane, y: -10, type: "wall" }));
          setObstacles((prev) => [...prev, ...wave]);
        } else {
          const lane = Math.floor(random() * LANES);
          const type = random() < 0.2 ? "wall" : "block";
          setObstacles((prev) => [...prev, { id: crypto.randomUUID(), lane, y: -10, type }]);
        }
      }

      if (ts - lastOrbSpawn.current >= (inBoss ? 3200 : 2200)) {
        lastOrbSpawn.current = ts;
        const lane = Math.floor(random() * LANES);
        setOrbs((prev) => [...prev, { id: crypto.randomUUID(), lane, y: -8 }]);
      }

      const velocity = dt * (0.026 + speed * 0.007 + Math.min(boost, 3) * 0.01 + (inBoss ? 0.012 : 0));
      setRoadOffset((r) => (r + velocity * 2.2) % 60);
      setObstacles((prev) => prev.map((o) => ({ ...o, y: o.y + velocity })).filter((o) => o.y < 115));
      setOrbs((prev) => prev.map((o) => ({ ...o, y: o.y + velocity * 0.88 })).filter((o) => o.y < 115));

      const laneBonus = playerLane === 1 ? 1.2 : 1;
      setScore((s) => s + Math.floor((dt / 16) * (1 + boost * 0.4) * combo * laneBonus * (inBoss ? 1.35 : 1)));
      setSpeed((s) => Math.min(11, s + dt * 0.000048));
      setBoost((b) => Math.max(0, b - dt * 0.00032));
      setCombo((c) => Math.max(1, c - dt * 0.00011));
      setNextBossIn(Math.max(0, Math.ceil((BOSS_EVERY_MS - (elapsed % BOSS_EVERY_MS)) / 1000)));

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, paused, speed, boost, combo, mode, playerLane]);

  useEffect(() => {
    if (!running || paused) return;

    const gotOrb = orbs.some((o) => o.lane === playerLane && o.y > 80 && o.y < 96);
    if (gotOrb) {
      setOrbs((prev) => prev.filter((o) => !(o.lane === playerLane && o.y > 80 && o.y < 96)));
      setBoost((b) => Math.min(4.8, b + 1.2));
      setCombo((c) => {
        const next = Math.min(4.5, c + 0.35);
        setPeakCombo((p) => Math.max(p, next));
        return next;
      });
      setOrbCount((c) => c + 1);
      setComboBurst(true);
      setTimeout(() => setComboBurst(false), 180);
      setScore((s) => s + 150);
      setMessage("ENERGY ORB COLLECTED ⚡ COMBO UP");
      playBeep(860, 0.06, "triangle", 0.03);
    }

    const nearMiss = obstacles.some((o) => o.lane !== playerLane && o.y > 90 && o.y < 98);
    if (nearMiss) {
      setCombo((c) => {
        const next = Math.min(4.8, c + 0.02);
        setPeakCombo((p) => Math.max(p, next));
        return next;
      });
    }

    const missionsDoneNow = score >= 2500 && orbCount >= 8 && bossesCleared >= 1;
    if (missionsDoneNow && !missionRewarded) {
      setMissionRewarded(true);
      setShield((s) => Math.max(1, s));
      setScore((s) => s + 750);
      setMessage("MISSION COMPLETE: +750 score and shield recharge");
      playBeep(980, 0.09, "triangle", 0.04);
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
        const final = score;
        setBest((b) => Math.max(b, final));
        if (mode === "daily") {
          const nextDaily = Math.max(dailyBest, final);
          setDailyBest(nextDaily);
          localStorage.setItem(`neon-grid-daily-${todayKey()}`, String(nextDaily));
        }
        if (final >= 2000) {
          setRunStreak((s) => s + 1);
        } else {
          setRunStreak(0);
        }
        setLastRun({
          score: final,
          orbs: orbCount,
          bosses: bossesCleared,
          peakCombo: Number(peakCombo.toFixed(1)),
          cause: "Collision"
        });
        saveScore(final);
        setMessage(final >= 2000 ? "DEREZZED — streak increased. Run it back." : "DEREZZED. Streak reset. Press Start.");
        setDangerFlash(true);
        playBeep(120, 0.18, "square", 0.06);
      }
    }
  }, [obstacles, orbs, playerLane, running, paused, shield, score, mode, dailyBest, orbCount, bossesCleared, missionRewarded, peakCombo]);

  const vibe = boost > 0 ? "from-cyan-900/35 via-fuchsia-900/20 to-indigo-950" : "from-slate-950 via-slate-950 to-indigo-950";
  const tier = speed > 8.5 ? "INSANE" : speed > 6 ? "HARD" : speed > 3.5 ? "NORMAL" : "EASY";
  const laneBonusActive = playerLane === 1;
  const boostPct = Math.min(100, Math.round((boost / 4.8) * 100));
  const comboPct = Math.min(100, Math.round((combo / 4.8) * 100));
  const missions = [
    { label: "Score 2500+", done: score >= 2500 },
    { label: "Collect 8 orbs", done: orbCount >= 8 },
    { label: "Clear 1 boss wave", done: bossesCleared >= 1 }
  ];
  const allMissionsDone = missions.every((m) => m.done);

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
            <button onClick={() => setSoundOn((s) => !s)} className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs">{soundOn ? "🔊 Sound On" : "🔈 Sound Off"}</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button onClick={() => setMode("classic")} className={`rounded-full px-3 py-1 ${mode === "classic" ? "bg-cyan-400 text-slate-950" : "border border-cyan-400/50"}`}>Classic</button>
            <button onClick={() => setMode("daily")} className={`rounded-full px-3 py-1 ${mode === "daily" ? "bg-fuchsia-400 text-slate-950" : "border border-fuchsia-400/50"}`}>Daily Challenge ({todayKey()})</button>
            <span className="rounded-full border border-cyan-400/30 px-3 py-1">Daily Best: {dailyBest}</span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.25fr_.75fr]">
          <div className={`rounded-2xl border border-cyan-400/40 bg-gradient-to-b ${vibe} p-4 shadow-[0_0_40px_rgba(14,165,233,.18)]`}>
            <div className={`relative h-[540px] overflow-hidden rounded-xl border border-cyan-500/30 bg-[#02030a] ${dangerFlash ? "animate-pulse" : ""}`}>
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage: "linear-gradient(to bottom, rgba(34,211,238,0.2) 1px, transparent 1px)",
                  backgroundSize: "100% 30px",
                  backgroundPositionY: `${roadOffset}px`
                }}
              />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "linear-gradient(to right, rgba(217,70,239,0.2) 1px, transparent 1px)",
                  backgroundSize: "44px 100%",
                  backgroundPositionY: `${roadOffset * 0.5}px`
                }}
              />

              {bossMode && <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-rose-400/60 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-200">BOSS WAVE</div>}

              {[0, 1, 2].map((lane) => <div key={lane} className="absolute top-0 bottom-0 w-px bg-cyan-400/30" style={{ left: `${laneX[lane]}%` }} />)}

              {obstacles.map((o) => (
                <div key={o.id} className={`absolute -translate-x-1/2 rounded-md ${o.type === "wall" ? "h-12 w-20 bg-fuchsia-500 shadow-fuchsia-500/50" : "h-10 w-16 bg-rose-500 shadow-rose-500/50"} shadow-lg`} style={{ left: `${laneX[o.lane]}%`, top: `${o.y}%` }} />
              ))}

              {orbs.map((o) => <div key={o.id} className="absolute -translate-x-1/2 h-6 w-6 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.8)]" style={{ left: `${laneX[o.lane]}%`, top: `${o.y}%` }} />)}

              <div className={`absolute -translate-x-1/2 h-12 w-16 rounded-lg ${skin.player} ${skin.glow} transition-all`} style={{ left: `${laneX[playerLane]}%`, bottom: "20px" }} />

              {shield > 0 && <div className="absolute -translate-x-1/2 h-16 w-20 rounded-xl border border-cyan-200/70 shadow-[0_0_28px_rgba(34,211,238,.5)]" style={{ left: `${laneX[playerLane]}%`, bottom: "14px" }} />}
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
                <Stat label="Combo" value={`${combo.toFixed(1)}x`} tone="cyan" pop={comboBurst} />
                <Stat label="Tier" value={tier} tone="fuchsia" />
                <Stat label="Streak" value={`${runStreak}`} tone="cyan" />
                <Stat label="State" value={paused ? "PAUSED" : running ? "RUNNING" : "IDLE"} tone="fuchsia" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-cyan-200/80">Shield</span><span>{shield > 0 ? "🛡️ Online" : "Offline"}</span></div>
              <div className="mt-1 flex items-center justify-between text-sm"><span className="text-cyan-200/80">Next boss</span><span>{nextBossIn}s</span></div>
              <div className="mt-2 rounded-lg border border-cyan-500/25 p-2 text-xs">
                <div className="mb-1 flex items-center justify-between"><span>Center lane bonus</span><span>{laneBonusActive ? "🟢 1.2x" : "⚪ 1.0x"}</span></div>
                <div className="mb-1 flex items-center justify-between"><span>Boost meter</span><span>{boost.toFixed(1)}x</span></div>
                <div className="h-1.5 w-full rounded bg-cyan-900/40"><div className="h-1.5 rounded bg-cyan-300" style={{ width: `${boostPct}%` }} /></div>
                <div className="mb-1 mt-2 flex items-center justify-between"><span>Combo meter</span><span>{combo.toFixed(1)}x</span></div>
                <div className="h-1.5 w-full rounded bg-fuchsia-900/40"><div className="h-1.5 rounded bg-fuchsia-300" style={{ width: `${comboPct}%` }} /></div>
              </div>
              <div className="mt-3 rounded-lg border border-cyan-500/25 p-2 text-xs">
                <p className="mb-1 font-semibold text-cyan-200">Run Missions</p>
                {missions.map((m) => <div key={m.label} className="flex items-center justify-between"><span>{m.label}</span><span>{m.done ? "✅" : "⬜"}</span></div>)}
              </div>
              <p className="mt-3 text-sm text-cyan-100/80">{message}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={start} className="rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-2 font-bold text-slate-950 hover:brightness-110">{running ? "Reboot Run" : "Start Run"}</button>
                <button
                  disabled={!running}
                  onClick={() => {
                    setPaused((v) => !v);
                    setMessage((m) => (m === "PAUSED" ? "RUNNER ONLINE" : "PAUSED"));
                  }}
                  className="rounded-lg border border-cyan-400/50 px-3 py-2 font-bold disabled:opacity-40"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4">
              <h3 className="font-semibold text-cyan-200">Skins</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {SKINS.map((s) => {
                  const unlocked = best >= s.unlock;
                  return (
                    <button
                      key={s.id}
                      disabled={!unlocked}
                      onClick={() => setSelectedSkin(s.id)}
                      className={`rounded-lg border px-2 py-2 text-left ${selectedSkin === s.id ? "border-cyan-300 bg-cyan-500/10" : "border-cyan-500/30"} ${!unlocked ? "opacity-45" : ""}`}
                    >
                      <div className="font-semibold">{s.name}</div>
                      <div>Unlock: {s.unlock}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4">
              <h3 className="font-semibold text-cyan-200">Last run recap</h3>
              {lastRun ? (
                <div className="mt-2 space-y-1 text-sm text-cyan-100/85">
                  <div className="flex items-center justify-between"><span>Score</span><strong>{lastRun.score}</strong></div>
                  <div className="flex items-center justify-between"><span>Orbs</span><strong>{lastRun.orbs}</strong></div>
                  <div className="flex items-center justify-between"><span>Bosses cleared</span><strong>{lastRun.bosses}</strong></div>
                  <div className="flex items-center justify-between"><span>Peak combo</span><strong>{lastRun.peakCombo}x</strong></div>
                  <div className="flex items-center justify-between"><span>Cause</span><strong>{lastRun.cause}</strong></div>
                </div>
              ) : <p className="mt-2 text-sm text-cyan-100/60">No completed run yet.</p>}
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4">
              <h3 className="font-semibold text-cyan-200">Top runners</h3>
              <ol className="mt-2 space-y-1 text-sm text-cyan-100/85">
                {leaderboard.length ? leaderboard.map((entry, idx) => (
                  <li key={`${entry.name}-${entry.score}-${idx}`} className="flex items-center justify-between border-b border-cyan-500/20 py-1">
                    <span>#{idx + 1} {entry.name}</span>
                    <strong>{entry.score}</strong>
                  </li>
                )) : <li className="text-cyan-100/60">No scores yet. Be the first.</li>}
              </ol>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, tone = "cyan", pop = false }) {
  const cls = tone === "fuchsia" ? "border-fuchsia-400/35 bg-fuchsia-900/10 text-fuchsia-100" : "border-cyan-400/35 bg-cyan-900/10 text-cyan-100";
  return (
    <div className={`rounded-lg border p-3 transition-transform duration-150 ${cls} ${pop ? "scale-105" : "scale-100"}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
