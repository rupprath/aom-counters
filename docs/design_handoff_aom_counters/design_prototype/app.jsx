/* global React */
const { useState, useMemo, useEffect } = React;
const { PANTHEONS, GODS, THREAT_ROWS, MYTH_ROWS, ZEUS_COUNTERS, COUNTER_MAP,
        mono, godMono } = window.AOM;

/* ------------------------------------------------------------------------ */
/* Image-slot placeholder.                                                  */
/*                                                                          */
/* Every unit and god in the design is a fixed-size image slot. At ship,    */
/* the real Microsoft / World's Edge screenshots drop in at:                */
/*   images/units/{id}.png   e.g.  images/units/gr_hoplite.png              */
/*   images/gods/{id}.png    e.g.  images/gods/zeus.png                     */
/*                                                                          */
/* For now we show a generic silhouette so the slot reads as "image here"   */
/* without faking unit art. The slot dimensions are the contract — they    */
/* don't change when art lands.                                             */
/* ------------------------------------------------------------------------ */
function Silhouette({ size = 22, kind = "unit" }) {
  /* `unit` silhouette = head + broader shoulders (combatant stance)        */
  /* `god`  silhouette = head + narrower bust (portrait crop)               */
  if (kind === "god") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           aria-hidden="true" className="slot-silhouette">
        <circle cx="12" cy="9" r="3.4" fill="currentColor" />
        <path d="M5.5 21c1.4-3.4 4.2-5.1 6.5-5.1s5.1 1.7 6.5 5.1v.6H5.5z"
              fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         aria-hidden="true" className="slot-silhouette">
      <circle cx="12" cy="8.5" r="3.4" fill="currentColor" />
      <path d="M3.6 21c1.4-3.7 4.6-5.7 8.4-5.7s7 2 8.4 5.7v.6H3.6z"
            fill="currentColor" />
    </svg>
  );
}

/* ============================================================ */
/* Shared pieces                                                 */
/* ============================================================ */

function GodPortrait({ god, size = 40, role }) {
  if (!god) return (
    <div className="god-portrait" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      <span style={{ color: "var(--text-faint)" }}>?</span>
    </div>
  );
  const ring = role === "player" ? "var(--select)" : role === "opponent" ? "var(--threat)" : "var(--line)";
  return (
    <div className="god-portrait"
         style={{ width: size, height: size, fontSize: size * 0.30,
                  borderColor: ring,
                  boxShadow: role ? `0 0 0 1px ${ring} inset` : undefined }}>
      <Silhouette size={Math.round(size * 0.55)} kind="god" />
    </div>
  );
}

function WinBtn({ title, onClick, children, kind }) {
  return (
    <button className={`win-btn ${kind || ""}`} onClick={onClick} title={title}>{children}</button>
  );
}
const ICON_GEAR = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const ICON_SWAP = (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 5.5h8M9 3l2.5 2.5L9 8M12.5 10.5h-8M7 8l-2.5 2.5L7 13"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ICON_MINUS = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const ICON_X = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

/* ============================================================ */
/* State 1 — Collapsed                                           */
/* ============================================================ */

function CollapsedState({ player, opponent, onClick, variant = "pill" }) {
  if (variant === "round") {
    return (
      <div className="pip" onClick={onClick} title="Expand">
        <div className="gods">
          <div className="pip-portrait p1"><Silhouette size={12} kind="god" /></div>
          <div className="pip-portrait p2"><Silhouette size={12} kind="god" /></div>
          <div className="pip-vs">VS</div>
        </div>
      </div>
    );
  }
  return (
    <div className="pip-pill" onClick={onClick} title="Expand">
      <div style={{ display: "flex" }}>
        <div className="pp p1"><Silhouette size={12} kind="god" /></div>
        <div className="pp p2"><Silhouette size={12} kind="god" /></div>
      </div>
      <span>{player?.name || "?"}</span>
      <span className="vs">VS</span>
      <span>{opponent?.name || "?"}</span>
    </div>
  );
}

/* ============================================================ */
/* State 2 — Setup                                               */
/* ============================================================ */

function SetupState({ player, opponent, onPick, onConfirm, onClose, firstLaunch }) {
  const [slot, setSlot] = useState(player ? "opponent" : "player");

  function pick(godId) {
    onPick(slot, godId);
    if (slot === "player" && !opponent) setSlot("opponent");
  }

  const ready = player && opponent;
  const isBlank = !player && !opponent;
  /* Show the welcome prompt on first launch OR whenever both slots are
     empty (e.g. user hit "New match" and cleared). */
  const showIntro = firstLaunch || isBlank;

  return (
    <div className="win" style={{ width: 360, height: 600 }}>
      <div className="win-titlebar">
        <span className="grip"><i/><i/><i/><i/><i/><i/></span>
        <span className="win-title">AOM Counters · {firstLaunch ? "Welcome" : "Setup"}</span>
        <div className="win-actions">
          <WinBtn title="Close" kind="close" onClick={onClose}>{ICON_X}</WinBtn>
        </div>
      </div>

      {showIntro && (
        <div className="setup-intro">
          <div className="setup-intro-eyebrow">
            {firstLaunch ? "Welcome — first match" : "New match"}
          </div>
          <div className="setup-intro-msg">
            Pick the god <b>you're playing</b> first, then your opponent's.
          </div>
          <div className="setup-intro-steps">
            <span className={`step ${slot === "player"   ? "active" : player   ? "done" : ""}`}>
              <span className="n">1</span> Your god
            </span>
            <span className="step-sep" />
            <span className={`step ${slot === "opponent" ? "active" : opponent ? "done" : ""}`}>
              <span className="n">2</span> Opponent
            </span>
          </div>
        </div>
      )}

      <div className="vs-strip">
        <button
          className={`vs-slot player ${slot === "player" ? "ring" : ""} ${!player ? "empty" : ""}`}
          onClick={() => setSlot("player")}
          style={{ border: 0, padding: "6px 8px", textAlign: "left", cursor: "pointer", background: "var(--bg-0)" }}
        >
          <GodPortrait god={player} size={32} role="player" />
          <div style={{ minWidth: 0 }}>
            <div className="vs-label">You play</div>
            <div className="vs-name">{player ? player.name : "Tap to pick"}</div>
          </div>
        </button>
        <span className="vs-sep">VS</span>
        <button
          className={`vs-slot opponent ${slot === "opponent" ? "ring" : ""} ${!opponent ? "empty" : ""}`}
          onClick={() => setSlot("opponent")}
          style={{ border: 0, padding: "6px 8px", textAlign: "left", cursor: "pointer", background: "var(--bg-0)" }}
        >
          <GodPortrait god={opponent} size={32} role="opponent" />
          <div style={{ minWidth: 0 }}>
            <div className="vs-label">Opponent</div>
            <div className="vs-name">{opponent ? opponent.name : "Tap to pick"}</div>
          </div>
        </button>
      </div>

      <div className="scroll" style={{ flex: 1 }}>
        {PANTHEONS.map(p => (
          <div key={p.id}>
            <div className="pantheon-hd">
              <span>{p.label}</span>
              <span className="rule" />
              <span style={{ color: "var(--text-faint)" }}>{p.gods.length}</span>
            </div>
            <div className="god-grid">
              {p.gods.map(g => {
                const selected =
                  (slot === "player"   && player?.id   === g.id) ||
                  (slot === "opponent" && opponent?.id === g.id);
                const takenByOther =
                  (slot === "player"   && opponent?.id === g.id) ||
                  (slot === "opponent" && player?.id   === g.id);
                return (
                  <button
                    key={g.id}
                    className={`god-cell ${selected ? "selected" : ""}`}
                    onClick={() => pick(g.id)}
                    style={takenByOther ? { opacity: 0.32, cursor: "default" } : undefined}
                    disabled={takenByOther}
                  >
                    <div className="god-portrait" style={{ width: 40, height: 40 }}>
                      <Silhouette size={22} kind="god" />
                    </div>
                    <div className="god-name">{g.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid var(--line-soft)", background: "var(--bg-1)" }}>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button className="btn primary" disabled={!ready} onClick={onConfirm}>
          {ready ? "Start matchup →" : "Pick both gods"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */
/* State 3 — Strip (horizontal overlay)                          */
/* ============================================================ */

function UnitImg({ unit, possible }) {
  return (
    <div className={`img cat-${unit.category} ${possible || unit.category === "myth" ? "myth" : ""}`}
         data-img-src={`images/units/${unit.id}.png`}>
      <span className="edge" />
      <Silhouette size={22} kind="unit" />
    </div>
  );
}

function Col({ unit, possible, pairKey, hovered, setHovered, dim }) {
  const isHov = hovered === pairKey;
  return (
    <div
      className={`col ${possible ? "possible" : ""} ${isHov ? "pair-hover" : ""} ${unit.category === "myth" ? "myth-col" : ""}`}
      onMouseEnter={() => setHovered && setHovered(pairKey)}
      onMouseLeave={() => setHovered && setHovered(null)}
      style={dim ? { opacity: 0.55 } : undefined}
      title={`${unit.name}${possible ? " (possible)" : ""}`}
    >
      <UnitImg unit={unit} possible={possible} />
      <div className="name">{unit.name}</div>
      {unit.via && <div className="via">via {unit.via}</div>}
    </div>
  );
}

function MythSummaryCol({ count, expanded, onToggle, hovered, setHovered }) {
  const isHov = hovered === "myth";
  return (
    <button
      className={`col myth-summary ${isHov ? "pair-hover" : ""}`}
      onMouseEnter={() => setHovered("myth")}
      onMouseLeave={() => setHovered(null)}
      onClick={onToggle}
      title={expanded ? "Collapse myth list" : `Show ${count} possible myth units`}
    >
      <div className="img myth stack">
        <span className="edge" />
        <span className="t t3" />
        <span className="t t2" />
        <span className="t t1">
          <Silhouette size={18} kind="unit" />
        </span>
        <span className="badge">×{count}</span>
      </div>
      <div className="name">Myth units</div>
      <div className="via">
        {expanded ? "tap to fold" : `${count} possible`}
        <span className="chev">{expanded ? "▴" : "▾"}</span>
      </div>
    </button>
  );
}

function StripState({ player, opponent, onCollapse, onSetup, showMyth = true }) {
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(false);

  /* For each threat, pick the primary counter (first in list) */
  const counterFor = id => {
    const ids = COUNTER_MAP[id] || [];
    return ids[0] ? ZEUS_COUNTERS[ids[0]] : null;
  };

  const threats = THREAT_ROWS;  /* all 8 core threats */
  const mythCount = MYTH_ROWS.length;
  const heroHover = hovered === "myth";

  return (
    <div className="strip" style={{ minWidth: 760 }}>
      {/* compact titlebar */}
      <div className="strip-bar">
        <span className="grip"><i/><i/><i/><i/><i/><i/></span>
        <span className="vs-mini">
          <span className="gp p1"><Silhouette size={10} kind="god" /></span>
          <span className="glyph">{player.name}</span>
          <span className="arrow">→</span>
          <span className="glyph">{opponent.name}</span>
          <span className="gp p2"><Silhouette size={10} kind="god" /></span>
        </span>
        <span className="meta">PATCH 19.10195 · {threats.length} threats · {mythCount} myth</span>
        <span className="strip-actions">
          <button className="new-match-btn"
                  onClick={onSetup}
                  title="Pick a new matchup">
            {ICON_SWAP}
            <span>New match</span>
          </button>
          <WinBtn title="Collapse to icon" onClick={onCollapse}>{ICON_MINUS}</WinBtn>
          <WinBtn title="Close" kind="close">{ICON_X}</WinBtn>
        </span>
      </div>

      <div className="strip-body">
        {/* ----- Enemy row -------------------------------------------- */}
        <div className="strip-row enemy">
          <div className="row-label enemy">
            <div className="kicker">They build</div>
            <div className="head">Enemy uses</div>
          </div>
          <div className="row-track">
            {threats.map((u) => (
              <Col key={u.id}
                   unit={u}
                   pairKey={u.id}
                   hovered={hovered}
                   setHovered={setHovered} />
            ))}
            {showMyth && (
              <>
                <div className="myth-divider" />
                {expanded ? (
                  <>
                    {MYTH_ROWS.map(m => (
                      <Col key={m.id}
                           unit={m}
                           possible
                           pairKey={"myth"}
                           hovered={hovered}
                           setHovered={setHovered} />
                    ))}
                    <button className="myth-fold"
                            onClick={() => setExpanded(false)}
                            title="Fold myth list">
                      ▴
                    </button>
                  </>
                ) : (
                  <MythSummaryCol
                    count={mythCount}
                    expanded={false}
                    onToggle={() => setExpanded(true)}
                    hovered={hovered}
                    setHovered={setHovered}
                  />
                )}
              </>
            )}
            <div className="row-end" />
          </div>
        </div>

        {/* ----- Counter row ------------------------------------------ */}
        <div className="strip-row counter">
          <div className="row-label counter">
            <div className="kicker">You build</div>
            <div className="head">Counter with</div>
          </div>
          <div className="row-track">
            {threats.map(u => {
              const c = counterFor(u.id);
              return (
                <Col key={u.id}
                     unit={c}
                     pairKey={u.id}
                     hovered={hovered}
                     setHovered={setHovered} />
              );
            })}
            {showMyth && (
              <>
                <div className="myth-divider" />
                <div className={`hero-zone ${heroHover ? "hov" : ""}`}
                     onMouseEnter={() => setHovered("myth")}
                     onMouseLeave={() => setHovered(null)}>
                  <div className="img" data-img-src={`images/units/${ZEUS_COUNTERS.gr_hero.id}.png`}>
                    <span className="edge" />
                    <Silhouette size={20} kind="unit" />
                  </div>
                  <div className="body">
                    <div className="name">{ZEUS_COUNTERS.gr_hero.name}</div>
                    <div className="sub">
                      Beats {expanded ? `all ${mythCount}` : "every"} myth unit{expanded ? "s" : ""}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="row-end" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* expose */
Object.assign(window, { CollapsedState, SetupState, StripState, GodPortrait, GODS });
