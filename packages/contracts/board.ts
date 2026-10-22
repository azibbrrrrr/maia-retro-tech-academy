export type BoardTab = "review" | "authored" | "blocked";
export type DemoCard = {
  id: string;
  title: string;
  category: BoardTab;
  status: string;
  description: string;
};
export type DemoBoard = {
  mode: "demo";
  source: string;
  fetchedAt: null;
  cards: DemoCard[];
};

export const demoBoard: DemoBoard = {
  mode: "demo",
  source: "Curated examples — not live GitHub",
  fetchedAt: null,
  cards: [
    {
      id: "lesson-01",
      title: "Make the library easier to explore",
      category: "review",
      status: "Example review requested",
      description:
        "A teammate asks you to check a proposed change. This is a lesson, not a real pull request.",
    },
    {
      id: "lesson-02",
      title: "Plant a little courtyard garden",
      category: "authored",
      status: "Example draft",
      description:
        "Drafts are work in progress. Your own open pull requests would appear in the private operator view.",
    },
    {
      id: "lesson-03",
      title: "Keep the classroom doorway clear",
      category: "blocked",
      status: "Example check failed",
      description:
        "A collision test found a blocked door. CI should explain the failure before a change is merged.",
    },
  ],
};
