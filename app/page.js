"use client";

import { useState, useEffect, useRef } from "react";

const COLOURS = {
  easy: [
    { name: "Red", hex: "#ff2255" },
    { name: "Blue", hex: "#2277ff" },
    { name: "Green", hex: "#00ff87" },
    { name: "Yellow", hex: "#ffe600" },
  ],
  medium: [
    { name: "Red", hex: "#ff2255" },
    { name: "Blue", hex: "#2277ff" },
    { name: "Green", hex: "#00ff87" },
    { name: "Yellow", hex: "#ffe600" },
    { name: "Purple", hex: "#cc00ff" },
    { name: "Orange", hex: "#ff8800" },
  ],
  hard: [
    { name: "Red", hex: "#ff2255" },
    { name: "Blue", hex: "#2277ff" },
    { name: "Green", hex: "#00ff87" },
    { name: "Yellow", hex: "#ffe600" },
    { name: "Purple", hex: "#cc00ff" },
    { name: "Orange", hex: "#ff8800" },
    { name: "Pink", hex: "#ff44cc" },
    { name: "Cyan", hex: "#00ccff" },
  ],
};

const SETTINGS = {
  easy: { slots: 4, guesses: 8, multiplier: 1 },
  medium: { slots: 5, guesses: 10, multiplier: 1.5 },
  hard: { slots: 6, guesses: 12, multiplier: 2 },
};

function generateSecret(difficulty, slots) {
  const colours = COLOURS[difficulty];
  const secret = [];
  for (let i = 0; i < slots; i++) {
    secret.push(colours[Math.floor(Math.random() * colours.length)]);
  }
  return secret;
}

function evaluateGuess(guess, secret) {
  let exact = 0;
  let present = 0;
  const secretRemain = [...secret];
  const guessRemain = [];

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] && guess[i].hex === secret[i].hex) {
      exact++;
      secretRemain[i] = null;
    } else {
      guessRemain.push(i);
    }
  }

  for (const i of guessRemain) {
    if (!guess[i]) continue;
    const idx = secretRemain.findIndex((s) => s && s.hex === guess[i].hex);
    if (idx !== -1) {
      present++;
      secretRemain[idx] = null;
    }
  }
  return { exact, present };
}

export default function CipherHue() {
  const [screen, setScreen] = useState("menu");
  const [difficulty, setDifficulty] = useState(null);
  const [secret, setSecret] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [maxGuesses, setMaxGuesses] = useState(0);
  const [slots, setSlots] = useState(0);
  const [selectedColour, setSelectedColour] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pastGuesses, setPastGuesses] = useState([]);
  const [hints, setHints] = useState([]); // array of {row, col, colour}
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cipherHueLeaderboard");
      if (saved) setLeaderboard(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    let timer;
    if (screen === "game" && !gameOver) {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screen, gameOver]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && screen === "game" && !gameOver) {
        const filled = currentGuess.filter((c) => c !== null).length;
        if (filled === slots) submitGuess();
      }
      if (e.key === "Escape") {
        setShowSaveModal(false);
        setShowHelpModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const calculateScore = () => {
    if (!difficulty) return 0;
    const s = SETTINGS[difficulty];
    const guessesUsed = currentRow + 1;
    const timeBonus = Math.max(0, 300 - elapsed);
    const guessBonus = (s.guesses - guessesUsed) * 80;
    const hintPenalty = hintsUsed * 0.1;
    const base = 500 + guessBonus + timeBonus;
    return Math.max(Math.round(base * s.multiplier * (1 - hintPenalty)), 10);
  };

  const startGame = (diff) => {
    const s = SETTINGS[diff];
    setDifficulty(diff);
    setMaxGuesses(s.guesses);
    setSlots(s.slots);
    setSecret(generateSecret(diff, s.slots));
    setCurrentRow(0);
    setCurrentGuess(new Array(s.slots).fill(null));
    setPastGuesses([]);
    setSelectedColour(null);
    setHintsUsed(0);
    setElapsed(0);
    setGameOver(false);
    setHints([]);
    setScreen("game");
  };

  const handleSlotClick = (row, col) => {
    if (row !== currentRow || gameOver) return;
    
    // Check if slot is a hint
    if (hints.some(h => h.row === row && h.col === col)) return;

    if (currentGuess[col]) {
      const newGuess = [...currentGuess];
      newGuess[col] = null;
      setCurrentGuess(newGuess);
      return;
    }

    if (selectedColour === null) return;
    const newGuess = [...currentGuess];
    newGuess[col] = COLOURS[difficulty][selectedColour];
    setCurrentGuess(newGuess);
  };

  const submitGuess = () => {
    if (gameOver) return;
    const filled = currentGuess.filter((c) => c !== null).length;
    if (filled !== slots) return;

    const { exact, present } = evaluateGuess(currentGuess, secret);
    
    setPastGuesses([...pastGuesses, { guess: [...currentGuess], exact, present }]);

    if (exact === slots) {
      setGameOver(true);
      setTimeout(() => {
        setScreen("win");
        launchConfetti();
      }, 1000);
      return;
    }

    if (currentRow + 1 >= maxGuesses) {
      setGameOver(true);
      setTimeout(() => setScreen("loss"), 1000);
      return;
    }

    setCurrentRow(currentRow + 1);
    
    // Propagate hints to next row
    const nextGuess = new Array(slots).fill(null);
    const newHints = [];
    hints.forEach(h => {
        if(h.row === currentRow) {
            nextGuess[h.col] = h.colour;
            newHints.push({row: currentRow + 1, col: h.col, colour: h.colour});
        } else {
            newHints.push(h);
        }
    });
    setHints([...hints, ...newHints]);
    setCurrentGuess(nextGuess);
  };

  const useHint = () => {
    if (hintsUsed >= 3 || gameOver) return;

    const unrevealedSlots = [];
    for (let i = 0; i < slots; i++) {
      if (!currentGuess[i] || currentGuess[i].hex !== secret[i].hex) {
        if (!hints.some(h => h.row === currentRow && h.col === i)) {
          unrevealedSlots.push(i);
        }
      }
    }
    if (unrevealedSlots.length === 0) return;

    const hintIdx = unrevealedSlots[Math.floor(Math.random() * unrevealedSlots.length)];
    const colour = secret[hintIdx];
    
    const newGuess = [...currentGuess];
    newGuess[hintIdx] = colour;
    setCurrentGuess(newGuess);
    
    setHints([...hints, { row: currentRow, col: hintIdx, colour }]);
    setHintsUsed(hintsUsed + 1);
  };

  const clearRow = () => {
    if (gameOver) return;
    const newGuess = currentGuess.map((c, i) => 
      hints.some(h => h.row === currentRow && h.col === i) ? c : null
    );
    setCurrentGuess(newGuess);
  };

  const saveScore = () => {
    const name = playerName.trim().toUpperCase().substring(0, 16) || "ANONYMOUS";
    const score = calculateScore();
    const newLb = [...leaderboard, { name, score, difficulty, date: new Date().toISOString() }];
    setLeaderboard(newLb);
    try {
      localStorage.setItem("cipherHueLeaderboard", JSON.stringify(newLb));
    } catch {}
    setShowSaveModal(false);
    setPlayerName("");
    setScreen("menu");
  };

  const launchConfetti = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const accentColours = ["#00f5ff", "#ff0080", "#00ff87", "#ffe600", "#ff7700", "#cc00ff"];
    const particles = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 4 + Math.random() * 8,
        h: 4 + Math.random() * 8,
        color: accentColours[Math.floor(Math.random() * accentColours.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        speed: 1.6 + Math.random() * 2,
        wobble: Math.random() * 4,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        wobblePhase: Math.random() * Math.PI * 2,
        isCircle: Math.random() > 0.5,
        opacity: 0.8 + Math.random() * 0.2,
      });
    }

    let frame = 0;
    const maxFrames = 200;

    const animate = () => {
      if (frame > maxFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.wobblePhase + frame * p.wobbleSpeed) * p.wobble;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity * Math.max(0, 1 - frame / maxFrames);
        ctx.fillStyle = p.color;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    };
    animate();
  };

  const renderTimerArc = () => {
    const maxTime = 300;
    const pct = Math.min(elapsed / maxTime, 1);
    const circumference = 2 * Math.PI * 27;
    const offset = circumference * (1 - pct);
    let stroke = "#00f5ff";
    if (pct >= 0.5 && pct < 0.8) stroke = "#ffe600";
    if (pct >= 0.8) stroke = "#ff0080";

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    return (
      <svg id="timer-svg" width="62" height="62" viewBox="0 0 62 62">
        <circle cx="31" cy="31" r="27" fill="none" stroke="rgba(0,245,255,0.1)" strokeWidth="3" />
        <circle
          cx="31" cy="31" r="27" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 31 31)"
        />
        <text x="31" y="35" textAnchor="middle" fill="#c0d4f0" fontFamily="var(--font-orbitron)" fontSize="11" fontWeight="700">
          {`${mins}:${String(secs).padStart(2, "0")}`}
        </text>
      </svg>
    );
  };

  const renderPegs = (r) => {
    const isPast = r < pastGuesses.length;
    const guessData = isPast ? pastGuesses[r] : null;
    const exact = guessData ? guessData.exact : 0;
    const present = guessData ? guessData.present : 0;

    const pegTypes = [];
    for (let i = 0; i < exact; i++) pegTypes.push("peg-exact peg-animate");
    for (let i = 0; i < present; i++) pegTypes.push("peg-present peg-animate");
    while (pegTypes.length < slots) pegTypes.push(isPast ? "peg-empty" : "peg-hidden");

    return pegTypes.map((type, i) => (
      <div key={i} className={`peg ${type}`} style={{ animationDelay: isPast ? `${i * 160}ms` : "0ms" }} />
    ));
  };

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <header id="top-bar">
        <div className="top-bar-left">
          <span className="brand-label">PS-07 CIPHER</span>
        </div>
        <div className="top-bar-right">
          <button className="ghost-icon-btn" title="Toggle Theme" aria-label="Toggle Theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button className="ghost-icon-btn" onClick={() => setShowHelpModal(true)} title="How to Play" aria-label="How to Play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button className="ghost-icon-btn" onClick={() => setScreen("menu")} title="Home" aria-label="Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>
      </header>

      {/* MAIN MENU */}
      <main className={`screen ${screen === "menu" ? "active" : ""}`}>
        <div className="menu-container">
          <div className="hero-logo-block">
            <div className="tagline">GAMING · PS-07 · HORIZON26</div>
            <h1 className="game-title">
              <span className="title-line">PROJECT /</span>
              <span className="title-line">CIPHER</span>
            </h1>
            <div className="subtitle">MASTERMIND VARIANT · COLOUR DEDUCTION</div>
          </div>

          <div className="difficulty-grid">
            {["easy", "medium", "hard"].map((diff) => (
              <button key={diff} className="difficulty-card" data-difficulty={diff} onClick={() => startGame(diff)}>
                <div className="card-inner">
                  <span className={`diff-label diff-${diff}`}>{diff.toUpperCase()}</span>
                  <div className="dot-row">
                    {Array(SETTINGS[diff].slots).fill(0).map((_, i) => (
                      <span key={i} className={`dot dot-${diff}`}></span>
                    ))}
                  </div>
                  <div className="diff-stats">{SETTINGS[diff].slots} COLOURS / {SETTINGS[diff].slots} SLOTS / {SETTINGS[diff].guesses} GUESSES</div>
                </div>
              </button>
            ))}
          </div>

          <div className="leaderboard-panel">
            <div className="leaderboard-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffe600" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              <span>TOP AGENTS — ALL TIME</span>
            </div>
            <div className="leaderboard-body">
              {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">NO SCORES RECORDED YET. COMPLETE A MISSION TO RANK.</div>
              ) : (
                leaderboard.sort((a, b) => b.score - a.score).slice(0, 8).map((entry, i) => (
                  <div key={i} className="lb-row">
                    <span className="lb-rank">{["🥇", "🥈", "🥉"][i] || (i + 1)}</span>
                    <span className="lb-name">{entry.name}</span>
                    <span className={`lb-badge lb-badge-${entry.difficulty}`}>{entry.difficulty.toUpperCase()}</span>
                    <span className="lb-score">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* GAME SCREEN */}
      <main className={`screen ${screen === "game" ? "active" : ""}`}>
        <div className="game-container">
          <div className="game-header-strip">
            <div className="info-cell">
              <div className="info-label">DIFFICULTY</div>
              <div className={`info-value diff-color-${difficulty}`}>{difficulty?.toUpperCase()}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">ATTEMPT</div>
              <div className="info-value">{currentRow + 1}/{maxGuesses}</div>
            </div>
            <div className="info-cell info-cell-timer">
              {renderTimerArc()}
            </div>
            <div className="info-cell">
              <div className="info-label">EST. SCORE</div>
              <div className="info-value">{calculateScore()}</div>
            </div>
            <div className="info-cell">
              <button className="hint-btn" onClick={useHint} disabled={hintsUsed >= 3}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <span>HINT</span>
              </button>
            </div>
          </div>

          <div className="guess-board">
            {Array(maxGuesses).fill(0).map((_, r) => {
              const isActive = r === currentRow;
              const isSubmitted = r < currentRow;
              const rowGuess = isSubmitted ? pastGuesses[r].guess : (isActive ? currentGuess : Array(slots).fill(null));

              return (
                <div key={r} className={`guess-row ${isActive ? "row-active" : ""} ${isSubmitted ? "row-submitted" : ""}`}>
                  <div className="row-number">{String(r + 1).padStart(2, "0")}</div>
                  <div className="slots">
                    {Array(slots).fill(0).map((_, c) => {
                      const color = rowGuess[c];
                      const isHint = hints.some(h => h.row === r && h.col === c);
                      return (
                        <div
                          key={c}
                          className={`slot ${color ? "slot-filled" : "slot-empty"} ${isActive ? "slot-active" : ""} ${isHint ? "slot-hint" : ""}`}
                          style={{
                            background: color ? color.hex : "",
                            boxShadow: color ? (isHint ? `0 0 0 2px rgba(255,230,0,0.5), 0 2px 10px ${color.hex}66` : `0 2px 10px ${color.hex}66`) : ""
                          }}
                          onClick={() => handleSlotClick(r, c)}
                        />
                      );
                    })}
                  </div>
                  <div className={`peg-grid cols-${slots <= 4 ? 2 : 3}`}>
                    {renderPegs(r)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="palette-panel">
            <div className="palette-label">① SELECT COLOUR · ② CLICK SLOT TO PLACE</div>
            <div className="palette-chips">
              {difficulty && COLOURS[difficulty].map((c, i) => (
                <div
                  key={i}
                  className={`chip ${selectedColour === i ? "chip-selected" : ""}`}
                  style={{ background: c.hex, boxShadow: `0 2px 12px ${c.hex}99` }}
                  onClick={() => setSelectedColour(i)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="action-row">
            <button className="action-btn btn-clear" onClick={clearRow}>CLEAR ROW</button>
            <button className="action-btn btn-submit" onClick={submitGuess} disabled={currentGuess.filter(c => c !== null).length !== slots}>SUBMIT GUESS</button>
          </div>
        </div>
      </main>

      {/* WIN SCREEN */}
      <main className={`screen ${screen === "win" ? "active" : ""}`}>
        <div className="result-container">
          <canvas ref={canvasRef} id="confetti-canvas" aria-hidden="true"></canvas>
          <h1 className="result-title result-win-title">
            <span>CIPHER /</span>
            <span>CRACKED!</span>
          </h1>
          <div className="result-subtitle">CODE SUCCESSFULLY DECIPHERED</div>
          <div className="result-stats">
            <div className="stat-card">
              <div className="stat-label">GUESSES USED</div>
              <div className="stat-value">{currentRow + 1}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">TIME ELAPSED</div>
              <div className="stat-value">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">HINTS USED</div>
              <div className="stat-value">{hintsUsed}</div>
            </div>
          </div>
          <div className="final-score-card">
            <div className="stat-label">FINAL SCORE</div>
            <div className="stat-value score-value">{calculateScore()}</div>
          </div>
          <div className="result-actions">
            <button className="action-btn btn-save" onClick={() => setShowSaveModal(true)}>SAVE SCORE</button>
            <button className="action-btn btn-play-again" onClick={() => startGame(difficulty)}>PLAY AGAIN</button>
            <button className="action-btn btn-menu" onClick={() => setScreen("menu")}>MENU</button>
          </div>
        </div>
      </main>

      {/* LOSS SCREEN */}
      <main className={`screen ${screen === "loss" ? "active" : ""}`}>
        <div className="result-container">
          <h1 className="result-title result-loss-title">
            <span>CIPHER /</span>
            <span>FAILED</span>
          </h1>
          <div className="result-subtitle">THE SECRET CODE WAS</div>
          <div className="secret-code-reveal">
            {secret.map((c, i) => (
              <div key={i} className="secret-dot" style={{ background: c.hex, boxShadow: `0 4px 14px ${c.hex}66` }} />
            ))}
          </div>
          <div className="result-stats">
            <div className="stat-card">
              <div className="stat-label">GUESSES USED</div>
              <div className="stat-value">{maxGuesses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">TIME ELAPSED</div>
              <div className="stat-value">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">HINTS USED</div>
              <div className="stat-value">{hintsUsed}</div>
            </div>
          </div>
          <div className="result-actions">
            <button className="action-btn btn-retry" onClick={() => startGame(difficulty)}>RETRY</button>
            <button className="action-btn btn-menu-loss" onClick={() => setScreen("menu")}>MENU</button>
          </div>
        </div>
      </main>

      {/* SAVE SCORE MODAL */}
      <div className={`modal-backdrop ${showSaveModal ? "open" : ""}`} aria-hidden={!showSaveModal} onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) setShowSaveModal(false); }}>
        <div className="modal-card">
          <h2 className="modal-title">SAVE YOUR SCORE</h2>
          <p className="modal-body">Enter your codename to register on the leaderboard.</p>
          <input
            type="text"
            className="modal-input"
            placeholder="AGENT NAME"
            maxLength={16}
            autoComplete="off"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <div className="modal-actions">
            <button className="action-btn btn-confirm" onClick={saveScore}>CONFIRM</button>
            <button className="action-btn btn-skip" onClick={() => { setShowSaveModal(false); setScreen("menu"); }}>SKIP</button>
          </div>
        </div>
      </div>

      {/* HOW TO PLAY MODAL */}
      <div className={`modal-backdrop ${showHelpModal ? "open" : ""}`} aria-hidden={!showHelpModal} onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) setShowHelpModal(false); }}>
        <div className="modal-card modal-help-card">
          <h2 className="modal-title">HOW TO PLAY</h2>
          <div className="help-grid">
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
              </div>
              <div className="help-card-title">OBJECTIVE</div>
              <div className="help-card-body">Deduce the secret colour code within the allowed number of guesses. Each slot holds one colour.</div>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
              </div>
              <div className="help-card-title">PLACING COLOURS</div>
              <div className="help-card-body">Select a colour from the palette, then click a slot in the active row to place it. Click a filled slot to clear it.</div>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><circle cx="7" cy="12" r="3" fill="#f0f0f0"/><circle cx="17" cy="12" r="3" fill="none" strokeDasharray="2 2"/></svg>
              </div>
              <div className="help-card-title">PEG FEEDBACK</div>
              <div className="help-card-body">After submitting: <span className="peg-example peg-exact"></span> = correct colour AND position. <span className="peg-example peg-present"></span> = correct colour, wrong position.</div>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <div className="help-card-title">SCORING</div>
              <div className="help-card-body">Base 1000pts. Fewer guesses & faster time = higher score. Difficulty multipliers: Easy ×1, Medium ×1.5, Hard ×2.</div>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff7700" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </div>
              <div className="help-card-title">HINTS</div>
              <div className="help-card-body">Up to 3 hints per game. Each hint reveals one correct colour+position but costs −10% of your final score.</div>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div className="help-card-title">ALGORITHM</div>
              <div className="help-card-body">Pegs use a two-pass check: first pass finds exact matches, second pass finds remaining colour matches from residuals.</div>
            </div>
          </div>
          <button className="action-btn btn-confirm help-close-btn" onClick={() => setShowHelpModal(false)}>UNDERSTOOD</button>
        </div>
      </div>
    </>
  );
}
