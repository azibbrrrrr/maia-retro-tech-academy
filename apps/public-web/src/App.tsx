import { useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import { Campus } from "../../../packages/game/Campus";
import type {
  Bridge,
  Direction,
  WorldState,
} from "../../../packages/game/bridge";
import {
  places,
  teacher,
  type Interaction,
} from "../../../packages/world/content";
import type { BoardTab, DemoBoard } from "../../../packages/contracts/board";

type Panel = Interaction | "directory" | null;
const initialWorld: WorldState = {
  x: 768,
  y: 888,
  area: "Dataran Akademi",
  nearby: "",
  ready: false,
};

function Game({ bridge }: { bridge: Bridge }) {
  const parent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parent.current!,
      backgroundColor: "#657451",
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      input: { keyboard: false },
      scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [new Campus(bridge)],
      banner: false,
    });
    return () => game.destroy(true);
  }, [bridge]);
  return (
    <div
      className="game"
      ref={parent}
      onPointerDown={() => {
        if (!bridge.paused) bridge.focus();
      }}
    />
  );
}

function DirectionButton({
  direction,
  glyph,
  bridge,
}: {
  direction: Direction;
  glyph: string;
  bridge: Bridge;
}) {
  return (
    <button
      className={`direction ${direction}`}
      aria-label={`Move ${direction}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        bridge.held.add(direction);
        bridge.focus();
      }}
      onPointerUp={() => bridge.held.delete(direction)}
      onPointerCancel={() => bridge.held.delete(direction)}
      onLostPointerCapture={() => bridge.held.delete(direction)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          bridge.held.add(direction);
        }
      }}
      onKeyUp={() => bridge.held.delete(direction)}
      onBlur={() => bridge.held.delete(direction)}
    >
      {glyph}
    </button>
  );
}

function Board() {
  const [board, setBoard] = useState<DemoBoard>();
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<BoardTab>("review");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch("/api/public/board", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        const result: DemoBoard = await response.json();
        if (result.mode !== "demo" || !Array.isArray(result.cards))
          throw new Error("Unsupported board");
        setBoard(result);
      })
      .catch(() => {
        setFailed(true);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  return (
    <>
      <p className="eyebrow">HIGH COUNCIL / THE WHITEBOARD</p>
      <h2 id="panel-title">
        Good work starts
        <br />
        with a second look.
      </h2>
      <p className="panel-intro">
        A little window into how software gets reviewed.
      </p>
      {failed ? (
        <div className="notice">
          <strong>OFFLINE</strong>
          <p>The board is unavailable. You can keep exploring the academy.</p>
        </div>
      ) : !board ? (
        <p role="status">Opening the whiteboard…</p>
      ) : (
        <>
          <div className="notice">
            <strong>DEMO DATA — not live GitHub</strong>
            <span>Curated examples · no live timestamp or private metrics</span>
          </div>
          <div className="tabs" role="tablist" aria-label="Whiteboard">
            {(
              [
                ["review", "Needs review"],
                ["authored", "My open PRs"],
                ["blocked", "CI & blockers"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                id={`tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {board.cards
              .filter((card) => card.category === tab)
              .map((card) => (
                <article className="pr-card" key={card.id}>
                  <p className="eyebrow">ACADEMY LESSON / {card.id}</p>
                  <h3>{card.title}</h3>
                  <span className="card-status">{card.status}</span>
                  <p>{card.description}</p>
                </article>
              ))}
          </div>
          <p className="muted">
            Real requested reviews, authored PRs and CI belong to the separate
            local operator view. This demonstration is not connected to GitHub.
          </p>
        </>
      )}
    </>
  );
}

export function App() {
  const [world, setWorld] = useState(initialWorld);
  const [panel, setPanel] = useState<Panel>(null);
  const [line, setLine] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const nextDialogue = useRef<HTMLButtonElement>(null);
  const bridge = useMemo<Bridge>(
    () => ({
      held: new Set(),
      paused: false,
      onState: setWorld,
      onInteract: (kind) => {
        setLine(0);
        setPanel(kind);
      },
      interact: () => {},
      visit: () => {},
      zoom: () => {},
      focus: () => {},
    }),
    [],
  );
  useEffect(() => {
    bridge.paused = panel !== null;
    bridge.held.clear();
    if (panel) {
      dialog.current?.showModal();
      if (panel === "teacher") nextDialogue.current?.focus();
    } else {
      dialog.current?.close();
      bridge.focus();
    }
  }, [panel, bridge]);
  const close = () => setPanel(null);
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MAIA academy home">
          <span className="brand-mark">M</span>
          <span>
            MAIA<span className="brand-sub">RETRO-TECH ACADEMY</span>
          </span>
        </a>
        <nav aria-label="Academy">
          <span className="active-nav">The campus</span>
          <button onClick={() => setPanel("welcome")}>
            About the academy ↗
          </button>
        </nav>
        <span className="mode-badge">
          <i /> DEMO CAMPUS
        </span>
      </header>
      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">
              SELAMAT DATANG / WELCOME TO YOUR FIRST DAY
            </p>
            <h1>
              Old-school charm.
              <br className="mobile-break" /> New-school ideas<span>.</span>
            </h1>
          </div>
          <p>
            A Malaysian school, a curious little world.
            <br />
            Take a walk. Meet Cikgu. Find your next idea.
          </p>
        </section>
        <div className="campus-layout">
          <section className="world-frame" aria-label="Interactive campus">
            <div className="world-toolbar">
              <span>
                <i className="location-dot" /> {world.area}
              </span>
              <span className="toolbar-right">
                VISITOR MODE <b>01</b>
              </span>
            </div>
            <div className="game-stage">
              <Game bridge={bridge} />
              {!world.ready && (
                <div className="loading">Opening the school gates…</div>
              )}
              <div className="world-tag">
                <span>AKADEMI MAIA</span>
                <small>A place to learn & build</small>
              </div>
              <div className="zoom-controls">
                <button aria-label="Zoom in" onClick={() => bridge.zoom(0.1)}>
                  +
                </button>
                <button aria-label="Zoom out" onClick={() => bridge.zoom(-0.1)}>
                  −
                </button>
              </div>
              <div className="interaction-hint" aria-live="polite">
                {world.nearby ? (
                  <>
                    <kbd>E</kbd> {world.nearby}
                  </>
                ) : (
                  "Follow the corridor. There’s something to discover."
                )}
              </div>
            </div>
            <div className="world-footer">
              <div className="visitor">
                <span className="visitor-icon">◆</span>
                <div>
                  <strong>Your explorer</strong>
                  <small>Just visiting. Always curious.</small>
                </div>
              </div>
              <span className="keyboard-help">
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd> or arrows to walk
              </span>
              <button
                className="directory-shortcut"
                onClick={() => setPanel("directory")}
                aria-label="Room directory"
              >
                ⌘ <span>Room directory</span>
              </button>
            </div>
          </section>
          <aside className="visit-sidebar">
            <div className="side-heading">
              <span className="eyebrow">YOUR FIELD NOTES</span>
              <span>✦</span>
            </div>
            <h2>Around the academy</h2>
            <svg
              className="mini-map"
              viewBox="0 0 1536 1056"
              role="img"
              aria-label={`Campus map. You are in ${world.area}.`}
            >
              <rect width="1536" height="1056" fill="#657451" />
              <path
                d="M96 480h1344v192H96zM672 672h192v384H672z"
                fill="#c8bd98"
              />
              <path
                d="M96 96h624v432H96zM816 96h624v432H816z"
                fill="#e9d9b7"
                stroke="#765438"
                strokeWidth="24"
              />
              <text x="408" y="330" textAnchor="middle">
                01
              </text>
              <text x="1128" y="330" textAnchor="middle">
                02
              </text>
              <circle cx="270" cy="800" r="105" fill="#354f3c" />
              <circle cx="1250" cy="800" r="105" fill="#354f3c" />
              <circle
                data-explorer
                cx={world.x}
                cy={world.y}
                r="32"
                fill="#f9da81"
                stroke="#172e2a"
                strokeWidth="12"
              />
            </svg>
            <p className="map-caption">
              <span>●</span> You are here <span>NOT TO SCALE</span>
            </p>
            <div className="room-notes">
              <div>
                <span className="room-number">01</span>
                <div>
                  <h3>High Council</h3>
                  <p>Big ideas on a small whiteboard.</p>
                </div>
                <span>↗</span>
              </div>
              <div>
                <span className="room-number rose">02</span>
                <div>
                  <h3>Bilik Cikgu ♡</h3>
                  <p>A warm hello from Ustazah Juliana.</p>
                </div>
                <span>♡</span>
              </div>
            </div>
            <div className="first-day">
              <p className="eyebrow">A LITTLE FIRST-DAY QUEST</p>
              <h3>Make yourself at home.</h3>
              <p>
                Head north through the courtyard. The covered corridor connects
                both classrooms.
              </p>
              <span>WALK · EXPLORE · SAY HELLO</span>
            </div>
            <p className="quiet-note">
              A quiet campus for now. Agent connections are{" "}
              <strong>offline</strong>; no live work is shown.
            </p>
          </aside>
        </div>
        <div className="touch-strip">
          <div className="dpad" aria-label="Movement controls">
            {(
              [
                ["up", "↑"],
                ["left", "←"],
                ["down", "↓"],
                ["right", "→"],
              ] as const
            ).map(([direction, glyph]) => (
              <DirectionButton
                key={direction}
                direction={direction}
                glyph={glyph}
                bridge={bridge}
              />
            ))}
          </div>
          <p>
            Take your time.
            <br />
            <span>The best ideas happen between classes.</span>
          </p>
          <button
            className="interact-button"
            disabled={!world.nearby || !world.ready}
            onClick={() => bridge.interact()}
            aria-label="Interact"
          >
            <kbd>E</kbd> Interact <span>↗</span>
          </button>
        </div>
      </main>
      <footer className="site-footer">
        <span>BUILT WITH CURIOSITY, IN MALAYSIA.</span>
        <span>
          Original world · Personal, unofficial showcase <b>SPRINT 0</b>
        </span>
      </footer>
      <dialog
        ref={dialog}
        aria-labelledby="panel-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <button
          className="close-panel"
          aria-label="Close panel"
          onClick={close}
        >
          ×
        </button>
        {panel === "board" && <Board />}
        {panel === "teacher" && (
          <div className="teacher-dialog">
            <p className="eyebrow">BILIK CIKGU / A FRIENDLY FACE</p>
            <span className="teacher-heart" aria-hidden="true">
              ♡
            </span>
            <h2 id="panel-title">{teacher.name}</h2>
            <span className="card-status rose">
              Schoolteacher · scripted character
            </span>
            <blockquote lang="ms">{teacher.dialogue[line]}</blockquote>
            <p className="muted">
              A little reminder from your friendly classroom teacher.
            </p>
            <button
              className="primary"
              aria-label="Next dialogue"
              ref={nextDialogue}
              onClick={() => setLine((line + 1) % teacher.dialogue.length)}
            >
              Sambung cerita <span>→</span>
            </button>
            <small>
              {line + 1} / {teacher.dialogue.length} · Malay dialogue
            </small>
          </div>
        )}
        {panel === "directory" && (
          <>
            <p className="eyebrow">FIND YOUR WAY</p>
            <h2 id="panel-title">Room directory</h2>
            <p className="panel-intro">
              Walk there, or jump to a doorway. Every room leads back to the
              courtyard.
            </p>
            {places.map((place) => (
              <button
                className="room-jump"
                key={place.id}
                onClick={() => {
                  close();
                  bridge.visit(place.id);
                }}
                aria-label={place.title}
              >
                <strong>{place.title}</strong>
                <small>{place.description}</small>
                <span>↗</span>
              </button>
            ))}
          </>
        )}
        {panel === "welcome" && (
          <>
            <p className="eyebrow">THE SCHOOL GATES ARE OPEN</p>
            <h2 id="panel-title">
              Selamat datang
              <br />
              ke Akademi MAIA.
            </h2>
            <p className="panel-intro">
              An original little Malaysian campus, where timber classrooms meet
              modern engineering ideas.
            </p>
            <ol className="welcome-list">
              <li>Move with WASD, arrow keys or the on-screen D-pad.</li>
              <li>
                Approach Cikgu or the whiteboard, then press E or tap Interact.
              </li>
              <li>
                Use the room directory for a quick trip. Escape closes any
                panel.
              </li>
            </ol>
            <div className="notice">
              <strong>YOUR OWN EXPLORER</strong>
              <span>
                You control your visitor avatar. This campus does not expose an
                owner’s coding session.
              </span>
            </div>
            <p className="muted">
              Sprint 0 · Original placeholder art · Demo board · Agent
              connections offline. No personal school information or live
              private data is shown.
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}
