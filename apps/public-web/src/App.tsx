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
  x: 836,
  y: 660,
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
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenPending, setFullscreenPending] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const fullscreenSupported =
    typeof document.documentElement.requestFullscreen === "function" &&
    typeof document.exitFullscreen === "function" &&
    document.fullscreenEnabled !== false;
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
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        panel !== null ||
        event.repeat ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.closest("input, textarea, select, [role='textbox']")))
      )
        return;
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setPanel("directory");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel]);
  useEffect(() => {
    const syncFullscreen = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);
  const toggleFullscreen = async () => {
    if (!fullscreenSupported || fullscreenPending) return;
    const exiting = Boolean(document.fullscreenElement);
    setFullscreenPending(true);
    setFullscreenMessage("");
    try {
      if (exiting) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreen(Boolean(document.fullscreenElement));
      bridge.focus();
    } catch {
      setFullscreen(Boolean(document.fullscreenElement));
      setFullscreenMessage(
        exiting
          ? "Fullscreen could not be closed. Try your browser’s fullscreen control."
          : "Fullscreen could not be opened. You can keep exploring here.",
      );
    } finally {
      setFullscreenPending(false);
    }
  };
  const close = () => setPanel(null);
  return (
    <div className="app-shell">
      <main className="game-stage" aria-label="Interactive campus">
        <h1 className="sr-only">
          MAIA Retro-Tech Academy — interactive campus
        </h1>
        <Game bridge={bridge} />
        {!world.ready && (
          <div className="loading" role="status">
            Opening the school gates…
          </div>
        )}
        <header className="hud-top">
          <button
            className="location-badge hud-surface"
            onClick={() => setPanel("welcome")}
            aria-label="About MAIA academy"
          >
            <span className="academy-name">MAIA / RETRO-TECH ACADEMY</span>
            <span className="mode-badge">DEMO</span>
            <strong>
              <span className="location-pin" aria-hidden="true">
                ●
              </span>{" "}
              {world.area}
            </strong>
          </button>
          <nav className="hud-actions" aria-label="Academy shortcuts">
            <button
              className="hud-button teacher-shortcut"
              disabled={!world.ready}
              onClick={() => {
                bridge.visit("teacher");
                bridge.focus();
              }}
            >
              Cikgu ♥
            </button>
            <button
              className="hud-button board-shortcut"
              disabled={!world.ready}
              onClick={() => {
                bridge.visit("council");
                bridge.focus();
              }}
            >
              PR Board
            </button>
            <button
              className="hud-button directory-shortcut"
              aria-label="Room directory"
              aria-keyshortcuts="M"
              onClick={() => setPanel("directory")}
            >
              Directory <span className="shortcut-key">[M]</span>
            </button>
            <button
              className="hud-button fullscreen-button"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={fullscreen}
              title={
                fullscreenSupported
                  ? fullscreen
                    ? "Exit fullscreen"
                    : "Enter fullscreen"
                  : "Fullscreen is not supported in this browser"
              }
              disabled={!fullscreenSupported || fullscreenPending}
              onClick={() => {
                void toggleFullscreen();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {fullscreen ? (
                  <path d="M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" />
                ) : (
                  <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />
                )}
              </svg>
            </button>
          </nav>
        </header>
        {fullscreenMessage && (
          <p className="fullscreen-message hud-surface" role="status">
            {fullscreenMessage}
          </p>
        )}
        <div className="dpad" role="group" aria-label="Movement controls">
          {(
            [
              ["up", "▲"],
              ["left", "◀"],
              ["down", "▼"],
              ["right", "▶"],
            ] as const
          ).map(([direction, glyph]) => (
            <DirectionButton
              key={direction}
              direction={direction}
              glyph={glyph}
              bridge={bridge}
            />
          ))}
          <span className="dpad-center" aria-hidden="true" />
        </div>
        <div className="interaction-hint">
          <button
            className="interact-button hud-surface"
            disabled={!world.nearby || !world.ready}
            onClick={() => bridge.interact()}
            aria-label="Interact"
          >
            <kbd>E</kbd>
            <span aria-live="polite">
              {world.nearby || "Explore the campus"}
            </span>
          </button>
        </div>
        <aside
          className="minimap-panel hud-surface"
          aria-label="Campus navigation"
        >
          <svg
            className="mini-map"
            viewBox="0 0 1672 941"
            role="img"
            aria-label={`Campus map. You are in ${world.area}.`}
          >
            <image href="/assets/campus.png" width="1672" height="941" />
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
          <div className="map-info">
            <p>
              <span className="keyboard-help">
                WASD / Arrow keys to explore
              </span>
              <span className="offline-note">Agent connections offline</span>
            </p>
            <span className="mode-badge">DEMO</span>
          </div>
        </aside>
      </main>
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
              Walk there, or jump into a room. Every room leads back to the
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
              Illustrated campus · Demo board · Agent connections offline. No
              personal school information or live private data is shown.
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}
