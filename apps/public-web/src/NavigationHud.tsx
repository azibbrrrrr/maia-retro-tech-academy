import { useState } from "react";
import type { Bridge, WorldState } from "../../../packages/game/bridge";
import { campusDefinition } from "../../../packages/world/unified-campus";

export function NavigationMap({
  world,
  bridge,
}: {
  world: WorldState;
  bridge: Bridge;
}) {
  const selectedActor = world.actors.find(
    (actor) => actor.id === world.selectedActor,
  );
  const { width, height } = campusDefinition.bounds;
  return (
    <aside className="minimap-panel hud-surface" aria-label="Campus navigation">
      <svg
        className="mini-map"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Full campus map. You are in ${world.area}.`}
      >
        <image
          href="/assets/campus-unified.png"
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="none"
        />
        {campusDefinition.zones
          .filter((zone) => zone.id !== "entrance")
          .map((zone) => {
            const points = zone.polygon
              .map((point) => `${point.x},${point.y}`)
              .join(" ");
            return (
              <polygon
                key={zone.id}
                points={points}
                fill={zone.id === world.zoneId ? "#ffdf8a33" : "#26352d11"}
                stroke={zone.id === world.zoneId ? "#ffdf8a" : "#fff2cf99"}
                strokeWidth="5"
                role="button"
                tabIndex={0}
                aria-label={`Focus ${zone.title}`}
                onClick={() => bridge.focusZone(zone.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    bridge.focusZone(zone.id);
                }}
              />
            );
          })}
        {campusDefinition.solids.map((solid) => (
          <rect
            key={solid.id}
            x={solid.x}
            y={solid.y}
            width={solid.width}
            height={solid.height}
            fill="#253b3266"
            stroke="#e9ddb577"
            strokeWidth="2"
          />
        ))}
        {campusDefinition.doorways.map((door) => (
          <circle
            key={door.id}
            cx={door.threshold.x}
            cy={door.threshold.y}
            r="9"
            fill="#ffcf5d"
          />
        ))}
        {campusDefinition.anchors.map((anchor) => (
          <circle
            key={anchor.id}
            cx={anchor.point.x}
            cy={anchor.point.y}
            r="7"
            fill={anchor.kind === "workstation" ? "#7bc5df" : "#e6c47b"}
          />
        ))}
        <circle
          data-explorer
          data-scene={world.zoneId}
          cx={world.x}
          cy={world.y}
          r="26"
          fill="#f9da81"
          stroke="#172e2a"
          strokeWidth="8"
        />
        {selectedActor?.position && (
          <circle
            data-selected-actor={selectedActor.id}
            role="img"
            aria-label={`Selected DEMO actor ${selectedActor.id} at ${selectedActor.zoneId}`}
            cx={selectedActor.position.x}
            cy={selectedActor.position.y}
            r="24"
            fill="#ff78b5"
            stroke="#fff7e5"
            strokeWidth="7"
          >
            <title>{`Selected DEMO actor ${selectedActor.id} at ${selectedActor.zoneId}`}</title>
          </circle>
        )}
      </svg>
      {selectedActor && (
        <p className="selected-actor-status" role="status" aria-live="polite">
          {selectedActor.position
            ? `Selected DEMO actor ${selectedActor.id} is at ${selectedActor.zoneId}.`
            : `Selected DEMO actor ${selectedActor.id} is off-seat; no map position is available.`}
        </p>
      )}
      <div className="map-info">
        <p>
          <span className="keyboard-help">WASD / Arrows · E interact</span>
          <span className="offline-note">Agent connections OFFLINE</span>
        </p>
        <span className="mode-badge">DEMO</span>
      </div>
    </aside>
  );
}

export function NavigationTools({
  world,
  bridge,
}: {
  world: WorldState;
  bridge: Bridge;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="navigation-tools">
      <button
        className="hud-button"
        aria-label="Navigation controls"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Navigate ☰
      </button>
      {open && (
        <section
          className="tools-panel hud-surface"
          aria-label="Navigation controls panel"
        >
          <p className="eyebrow">CAMERA · DEMO / OFFLINE</p>
          <div className="tool-row">
            <button
              aria-pressed={world.camera.mode === "overview"}
              onClick={() => bridge.cameraMode("overview")}
            >
              Overview
            </button>
            <button
              aria-pressed={world.camera.mode === "player"}
              onClick={() => bridge.cameraMode("player")}
            >
              Follow player
            </button>
            <button
              aria-pressed={world.camera.mode === "free"}
              onClick={() => bridge.cameraMode("free")}
            >
              Touch pan
            </button>
          </div>
          <div className="tool-row">
            <button aria-label="Zoom out" onClick={() => bridge.zoom(-0.15)}>
              −
            </button>
            <output aria-label="Camera zoom">
              {world.camera.zoom.toFixed(2)}×
            </output>
            <button aria-label="Zoom in" onClick={() => bridge.zoom(0.15)}>
              +
            </button>
          </div>
          <div className="tool-row">
            <button aria-label="Pan left" onClick={() => bridge.pan(-120, 0)}>
              ←
            </button>
            <button aria-label="Pan up" onClick={() => bridge.pan(0, -120)}>
              ↑
            </button>
            <button aria-label="Pan down" onClick={() => bridge.pan(0, 120)}>
              ↓
            </button>
            <button aria-label="Pan right" onClick={() => bridge.pan(120, 0)}>
              →
            </button>
          </div>
          <label>
            DEMO workers{" "}
            <select
              aria-label="DEMO population"
              value={world.actors.length}
              onChange={(event) =>
                bridge.demoActors(Number(event.target.value))
              }
            >
              {[0, 4, 12, 20, 28].map((count) => (
                <option key={count} value={count}>
                  {count} workers
                  {count === 20
                    ? " · 16 stations + 4 overflow"
                    : count === 28
                      ? " · 8 without positions"
                      : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Follow DEMO actor{" "}
            <select
              aria-label="Follow DEMO actor"
              value={world.selectedActor}
              onChange={(event) => bridge.selectActor(event.target.value)}
            >
              <option value="">Select a mock actor</option>
              {world.actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.id} · {actor.zoneId}
                </option>
              ))}
            </select>
          </label>
          <p className="registry-summary">
            {world.visibleActors} positioned / {world.actors.length} tracked ·{" "}
            {world.actors.filter((actor) => !actor.position).length} without a
            map position · DEMO labels only
          </p>
          <div className="tool-row">
            <button aria-pressed={world.debug} onClick={() => bridge.debug()}>
              Collision diagnostics
            </button>
            <button aria-pressed={!world.art} onClick={() => bridge.art()}>
              Toggle art
            </button>
          </div>
          {world.debug && (
            <div className="diagnostics" aria-label="Collision diagnostics">
              <p>
                Pink outlines are collision bodies · blue circles are approaches
                · white rectangle is the visitor foot body.
              </p>
              <output
                data-body={JSON.stringify(world.body)}
                data-camera={JSON.stringify(world.camera)}
                data-teacher={JSON.stringify(world.teacher ?? null)}
                data-performance={JSON.stringify(world.performance)}
                data-actors={JSON.stringify(world.actors)}
              >
                Foot {world.body?.width.toFixed(4)} ×{" "}
                {world.body?.height.toFixed(4)} · offsets{" "}
                {world.body?.left.toFixed(4)}, {world.body?.top.toFixed(4)}
                <br />
                Camera {world.camera.mode} · visitor {world.x},{world.y}
                <br />
                {world.performance.frameMs.toFixed(2)} ms/frame
                <br />
                {world.performance.objects} objects /{" "}
                {world.performance.staticBodies} static bodies
                <br />
                {world.teacher
                  ? `Teacher stationary ${world.teacher.x},${world.teacher.y} · frame ${world.teacher.frame}`
                  : "Teacher is in Bilik Cikgu"}
              </output>
              <details>
                <summary>Texture memory estimate / DEMO registry</summary>
                {world.performance.textures.map((texture) => (
                  <p key={texture.key}>
                    {texture.key} {texture.width}×{texture.height} ·{" "}
                    {texture.bytes} RGBA bytes · {texture.filter}
                  </p>
                ))}
                {world.actors.map((actor) => (
                  <p key={actor.id}>
                    {actor.id} / {actor.taskId} · {actor.zoneId} ·{" "}
                    {actor.anchorId ?? "no position"} · {actor.workState} · DEMO
                  </p>
                ))}
              </details>
            </div>
          )}
        </section>
      )}
      <output
        className="sr-only"
        aria-label="Camera status"
        data-camera-mode={world.camera.mode}
        data-camera-zoom={world.camera.zoom}
      >
        {world.camera.mode}
      </output>
    </div>
  );
}
