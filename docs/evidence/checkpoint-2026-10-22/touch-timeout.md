# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: campus.spec.ts >> touch D-pad physically crosses all seven room openings and keeps map and speech controls available
- Location: tests/e2e/campus.spec.ts:57:1

# Error details

```
Test timeout of 900000ms exceeded.
```

# Page snapshot

```yaml
- main "Interactive campus" [ref=e4]:
  - heading "MAIA Retro-Tech Academy — interactive campus" [level=1] [ref=e5]
  - generic "Walkable academy. Use arrow keys or WASD to move, E to interact." [active] [ref=e7]
  - generic:
    - button "Focus academy courtyard" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: MAIA / RETRO-TECH ACADEMY
      - generic [ref=e10]: DEMO
      - strong [ref=e11]:
        - generic [aria-hidden] [ref=e12]: ●
        - text: Bilik Cikgu
    - navigation "Academy shortcuts":
      - button "Cikgu ♥" [ref=e13] [cursor=pointer]
      - button "PR Board" [ref=e14] [cursor=pointer]
      - button "Room directory" [ref=e15] [cursor=pointer]: Directory [M]
      - button "Enter fullscreen" [ref=e16] [cursor=pointer]
  - group "Movement controls" [ref=e19]:
    - button "Move up" [ref=e20] [cursor=pointer]: ▲
    - button "Move left" [ref=e21] [cursor=pointer]: ◀
    - button "Move down" [ref=e22] [cursor=pointer]: ▼
    - button "Move right" [ref=e23] [cursor=pointer]: ▶
  - button "Interact" [ref=e26] [cursor=pointer]:
    - generic [ref=e27]: "[E]"
    - generic [ref=e28]: Ustazah Juliana conversation approach
  - region "Ustazah Juliana speech bubble" [ref=e29]:
    - generic [ref=e30]:
      - strong [ref=e31]: Ustazah Juliana
      - button "Close chat" [ref=e32] [cursor=pointer]: ×
    - log [ref=e33]:
      - paragraph [ref=e34]: Awak dah makan belum?
    - generic [ref=e35]:
      - generic [ref=e36]: Scripted character · 1/4
      - button "Next dialogue" [ref=e37] [cursor=pointer]: Next · E →
  - generic [ref=e38]:
    - button "Navigation controls" [expanded] [ref=e39] [cursor=pointer]: Navigate ☰
    - region "Navigation controls panel" [ref=e40]:
      - paragraph [ref=e41]: CAMERA · DEMO / OFFLINE
      - generic [ref=e42]:
        - button "Overview" [ref=e43] [cursor=pointer]
        - button "Follow player" [ref=e44] [cursor=pointer]
        - button "Touch pan" [pressed] [ref=e45] [cursor=pointer]
      - generic [ref=e46]:
        - button "Zoom out" [ref=e47] [cursor=pointer]: −
        - status "Camera zoom" [ref=e48]: 0.44×
        - button "Zoom in" [ref=e49] [cursor=pointer]: +
      - generic [ref=e50]:
        - button "Pan left" [ref=e51] [cursor=pointer]: ←
        - button "Pan up" [ref=e52] [cursor=pointer]: ↑
        - button "Pan down" [ref=e53] [cursor=pointer]: ↓
        - button "Pan right" [ref=e54] [cursor=pointer]: →
      - generic [ref=e55]:
        - text: DEMO workers
        - combobox "DEMO population" [ref=e56]:
          - option "0 workers"
          - option "4 workers"
          - option "12 workers"
          - option "20 workers · 16 stations + 4 overflow" [selected]
          - option "28 workers · 8 without positions"
      - generic [ref=e57]:
        - text: Follow DEMO actor
        - combobox "Follow DEMO actor" [ref=e58]:
          - option "Select a mock actor" [selected]
          - option "demo-worker-001 · engineering_lab"
          - option "demo-worker-002 · engineering_lab"
          - option "demo-worker-003 · engineering_lab"
          - option "demo-worker-004 · engineering_lab"
          - option "demo-worker-005 · engineering_lab"
          - option "demo-worker-006 · engineering_lab"
          - option "demo-worker-007 · engineering_lab"
          - option "demo-worker-008 · engineering_lab"
          - option "demo-worker-009 · engineering_lab"
          - option "demo-worker-010 · engineering_lab"
          - option "demo-worker-011 · engineering_lab"
          - option "demo-worker-012 · engineering_lab"
          - option "demo-worker-013 · engineering_lab"
          - option "demo-worker-014 · engineering_lab"
          - option "demo-worker-015 · engineering_lab"
          - option "demo-worker-016 · engineering_lab"
          - option "demo-worker-017 · kantin"
          - option "demo-worker-018 · kantin"
          - option "demo-worker-019 · cikgu_room"
          - option "demo-worker-020 · entrance"
      - paragraph [ref=e59]: 20 positioned / 20 tracked · 0 without a map position · DEMO labels only
      - generic [ref=e60]:
        - button "Collision diagnostics" [ref=e61] [cursor=pointer]
        - button "Toggle art" [ref=e62] [cursor=pointer]
    - status "Camera status" [ref=e63]: free
  - complementary "Campus navigation" [ref=e64]:
    - img "Full campus map. You are in Bilik Cikgu." [ref=e65]:
      - button "Focus Perpustakaan" [ref=e67]
      - button "Focus Makmal Kejuruteraan" [ref=e68]
      - button "Focus Watchtower NOC" [ref=e69]
      - button "Focus Dewan High Council" [ref=e70]
      - button "Focus Makmal QA" [ref=e71]
      - button "Focus Kantin Akademi" [ref=e72]
      - button "Focus Bilik Cikgu" [ref=e73]
    - generic [ref=e225]:
      - paragraph [ref=e226]:
        - generic [ref=e227]: WASD / Arrows · E interact
        - generic [ref=e228]: Agent connections OFFLINE
      - generic [ref=e229]: DEMO
```