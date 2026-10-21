import { useLayoutEffect, useRef, useState } from "react";
import type { SpeechAnchor, WorldState } from "../../../packages/game/bridge";
import { teacher, type Interaction } from "../../../packages/world/content";
export type Speech = SpeechAnchor & { kind: Exclude<Interaction, "board"> };

/** A camera-space callout: no dialog, backdrop, autofocus or movement lock. */
export function SpeechBubble({
  speech,
  world,
  line,
  onNext,
  onClose,
}: {
  speech: Speech;
  world: WorldState;
  line: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const element = useRef<HTMLElement>(null),
    [height, setHeight] = useState(180);
  const c = world.camera,
    width = Math.min(300, c.width - 24);
  useLayoutEffect(() => {
    if (element.current)
      setHeight(element.current.getBoundingClientRect().height);
  }, [speech.kind, speech.label, line, width]);
  const x = (speech.speaker.x - c.x - c.width / 2) * c.zoom + c.width / 2,
    y = (speech.speaker.y - c.y - c.height / 2) * c.zoom + c.height / 2;
  const minTop = c.height < 480 ? 84 : c.width < 761 ? 196 : 112;
  const left = Math.max(12, Math.min(c.width - width - 12, x + 24));
  const top = Math.max(
    12,
    Math.min(c.height - height - 12, Math.max(minTop, y - height - 16)),
  );
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  let a: { x: number; y: number }, b: { x: number; y: number };
  if (x < left || x > left + width) {
    const edge = x < left ? left : left + width,
      center = clamp(y, top + 20, top + height - 20);
    a = { x: edge, y: center - 8 };
    b = { x: edge, y: center + 8 };
  } else {
    const edge = y < top ? top : top + height,
      center = clamp(x, left + 20, left + width - 20);
    a = { x: center - 8, y: edge };
    b = { x: center + 8, y: edge };
  }
  const speaker = speech.kind === "teacher" ? teacher.name : speech.label;
  if (x < 0 || x > c.width || y < 0 || y > c.height) return null;
  return (
    <>
      <svg
        className="speech-tail"
        width={c.width}
        height={c.height}
        aria-hidden="true"
        data-speech-tail
        data-anchor-x={x}
        data-anchor-y={y}
      >
        <path
          d={`M ${a.x},${a.y} L ${x},${y} L ${b.x},${b.y} Z`}
          fill="#f8edcf"
          stroke="#4d6254"
          strokeWidth="2"
        />
      </svg>
      <section
        ref={element}
        className="speech-bubble"
        role="region"
        aria-label={`${speaker} speech bubble`}
        style={{ left, top, width }}
      >
        <header>
          <strong>{speaker}</strong>
          <button aria-label="Close chat" onClick={onClose}>
            ×
          </button>
        </header>
        <div role="log" aria-live="polite" aria-atomic="true">
          {speech.kind === "teacher" ? (
            <p lang="ms">{teacher.dialogue[line]}</p>
          ) : speech.kind === "welcome" ? (
            <p>
              Selamat datang ke Akademi MAIA. Walk with WASD, arrows or the
              D-pad. Use E at gold transfer pads. The directory offers quick
              travel.
            </p>
          ) : (
            <p>
              {world.area} · Temporary navigation study. This DEMO station is
              reachable; live work is OFFLINE.
            </p>
          )}
        </div>
        <footer>
          {speech.kind === "teacher" ? (
            <>
              <span>
                Scripted character · {line + 1}/{teacher.dialogue.length}
              </span>
              <button aria-label="Next dialogue" onClick={onNext}>
                Next · E →
              </button>
            </>
          ) : (
            <span>DEMO / OFFLINE · Escape to dismiss</span>
          )}
        </footer>
      </section>
    </>
  );
}
