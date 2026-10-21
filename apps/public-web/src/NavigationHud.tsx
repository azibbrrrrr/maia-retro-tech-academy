import { useState } from "react";
import type { Bridge, WorldState } from "../../../packages/game/bridge";
import { sceneCatalog, sceneIds } from "../../../packages/world/scenes";

export function NavigationMap({ world }: { world: WorldState }) {
  const [campus, setCampus] = useState(false);
  const scene = sceneCatalog[world.sceneId];
  const selectedActor = world.actors.find(
    (actor) => actor.id === world.selectedActor,
  );
  const node = (id: (typeof sceneIds)[number]) => ({
    x: 150 + sceneCatalog[id].mapPosition.x * 94,
    y: 30 + sceneCatalog[id].mapPosition.y * 72,
  });
  return (
    <aside className="minimap-panel hud-surface" aria-label="Campus navigation">
      <button
        className="map-toggle"
        aria-label={campus ? "Show room map" : "Show campus connections"}
        onClick={() => setCampus(!campus)}
      >
        {campus ? "Campus connections" : "Room map"} ↔
      </button>
      {campus && (
        <svg
          className="campus-graph"
          viewBox="0 0 300 210"
          role="img"
          aria-label="Logical campus connections: entrance links all seven rooms"
        >
          {sceneCatalog.entrance.portals.map((p) => {
            const a = node("entrance"),
              b = node(p.targetScene);
            return (
              <line
                key={p.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#cfb77e"
                strokeWidth="2"
              />
            );
          })}
          {sceneIds.map((id) => {
            const p = node(id);
            const actorRoom = selectedActor?.sceneId === id;
            return (
              <g key={id}>
                <rect
                  x={p.x - 42}
                  y={p.y - 12}
                  width="84"
                  height="25"
                  rx="4"
                  fill={world.sceneId === id ? "#ddbd76" : "#435d57"}
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  fontSize="10"
                  textAnchor="middle"
                  fill={world.sceneId === id ? "#182e28" : "#fff4cf"}
                >
                  {id
                    .replace("engineering_lab", "eng. lab")
                    .replace("high_council", "council")
                    .replace("cikgu_room", "cikgu")
                    .replace("qa_lab", "QA lab")}
                </text>
                {actorRoom && id !== world.sceneId && (
                  <circle
                    data-selected-actor-id={selectedActor.id}
                    data-selected-actor-scene={id}
                    role="img"
                    aria-label={`Selected DEMO actor room: ${sceneCatalog[id].title}`}
                    cx={p.x + 35}
                    cy={p.y - 10}
                    r="7"
                    fill="#ff78b5"
                    stroke="#fff7e5"
                    strokeWidth="2"
                  >
                    <title>{`Selected DEMO actor room: ${sceneCatalog[id].title}`}</title>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <svg
        className="mini-map"
        viewBox={`0 0 ${scene.bounds.width} ${scene.bounds.height}`}
        role="img"
        aria-label={`Room map. You are in ${world.area}.`}
      >
        <rect
          width={scene.bounds.width}
          height={scene.bounds.height}
          fill="#273c3b"
        />
        {scene.reservedLanes.map((r) => (
          <rect
            key={r.id}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill="#406b57"
          />
        ))}
        {scene.solids.map((r) => (
          <rect
            key={r.id}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill="#81908a"
          />
        ))}
        {scene.portals.map((p) => (
          <rect
            key={p.id}
            x={p.x}
            y={p.y}
            width={p.width}
            height={p.height}
            fill="#ffcf5d"
          />
        ))}
        {scene.anchors.map((a) => (
          <circle
            key={a.id}
            cx={a.point.x}
            cy={a.point.y}
            r="12"
            fill="#7bc5df"
          />
        ))}
        <circle
          data-explorer
          data-scene={world.sceneId}
          cx={world.x}
          cy={world.y}
          r="24"
          fill="#f9da81"
          stroke="#172e2a"
          strokeWidth="8"
        />
        {selectedActor?.sceneId === world.sceneId && selectedActor.position && (
          <circle
            data-selected-actor={selectedActor.id}
            role="img"
            aria-label={`Selected DEMO actor ${selectedActor.id} in this room`}
            cx={selectedActor.position.x}
            cy={selectedActor.position.y}
            r="18"
            fill="#ff78b5"
            stroke="#fff7e5"
            strokeWidth="6"
          >
            <title>{`Selected DEMO actor ${selectedActor.id} in this room`}</title>
          </circle>
        )}
      </svg>
      {selectedActor && (
        <p className="selected-actor-status" role="status" aria-live="polite">
          {selectedActor.sceneId === world.sceneId
            ? selectedActor.position
              ? `Selected DEMO actor ${selectedActor.id} is shown in this room map.`
              : `Selected DEMO actor ${selectedActor.id} is off-seat in ${scene.title}; no map coordinate.`
            : `Selected DEMO actor ${selectedActor.id} is in ${sceneCatalog[selectedActor.sceneId].title} (off-room).${selectedActor.position ? "" : " No map coordinate is available."}`}
        </p>
      )}
      <div className="map-info">
        <p>
          <span className="keyboard-help">WASD / Arrows · E interact</span>
          <span className="offline-note">Agent connections OFFLINE</span>
        </p>
        <span className="mode-badge">DEMO</span>
      </div>
      {scene.temporary && (
        <p className="study-note">Temporary navigation study</p>
      )}
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
            Mock population{" "}
            <select
              aria-label="DEMO population"
              value={world.actors.length}
              onChange={(e) => bridge.demoActors(Number(e.target.value))}
            >
              {[0, 4, 12, 20, 28].map((n) => (
                <option key={n} value={n}>
                  {n} DEMO workers{n === 20 ? " · congestion" : ""}
                  {n === 28 ? " · overflow" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Follow DEMO actor{" "}
            <select
              aria-label="Follow DEMO actor"
              value={world.selectedActor}
              onChange={(e) => bridge.selectActor(e.target.value)}
            >
              <option value="">Select a mock actor</option>
              {world.actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} · {a.sceneId}
                </option>
              ))}
            </select>
          </label>
          {world.selectedActor &&
            world.actors.find((a) => a.id === world.selectedActor)?.sceneId !==
              world.sceneId && (
              <p className="registry-summary">
                Selected actor is off-room; its DEMO task stays tracked.
              </p>
            )}
          <p className="registry-summary">
            {world.visibleActors} in room / {world.actors.length} tracked ·{" "}
            {world.actors.filter((a) => !a.position).length} off-seat · DEMO
            activity only
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
                Pink solids · green aisles · blue approaches · yellow route ·
                white live foot body
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
                Camera {world.camera.mode} · {world.x},{world.y}
                <br />
                {world.performance.frameMs.toFixed(2)} ms/frame · last transfer{" "}
                {world.performance.transitionMs.toFixed(1)} ms
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
                {world.performance.textures.map((t) => (
                  <p key={t.key}>
                    {t.key} {t.width}×{t.height} · {t.bytes} RGBA bytes ·{" "}
                    {t.filter}
                  </p>
                ))}
                {world.actors.map((a) => (
                  <p key={a.id}>
                    {a.id} / {a.taskId} · {a.sceneId} ·{" "}
                    {a.anchorId ?? "off-seat"} · {a.workState} · DEMO
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
