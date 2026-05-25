export type CanvasSide = "a" | "b";

export const CANVAS_SIDES = ["a", "b"] as const satisfies readonly CanvasSide[];

export const DEFAULT_SIDE: CanvasSide = "a";

export const SIDE_INFO: Record<
  CanvasSide,
  {
    id: CanvasSide;
    label: string;
    shortLabel: string;
    teamName: string;
    tagline: string;
    description: string;
    color: "kamal" | "cockroach";
    symbol: string;
    symbolLabel: string;
  }
> = {
  a: {
    id: "a",
    label: "Canvas A",
    shortLabel: "Kamal",
    teamName: "Canvas A",
    tagline: "Public pixel canvas",
    description: "Buy pixels. Reveal the image.",
    color: "kamal",
    symbol: "◆",
    symbolLabel: "pixel",
  },
  b: {
    id: "b",
    label: "Canvas B",
    shortLabel: "Cockroach",
    teamName: "Canvas B",
    tagline: "Public pixel canvas",
    description: "Buy pixels. Reveal the image.",
    color: "cockroach",
    symbol: "◆",
    symbolLabel: "pixel",
  },
};

export function isCanvasSide(value: string | null | undefined): value is CanvasSide {
  return value === "a" || value === "b";
}

export function parseSide(raw: string | null | undefined, fallback: CanvasSide = DEFAULT_SIDE): CanvasSide {
  if (isCanvasSide(raw)) return raw;
  if (raw === null || raw === undefined || raw === "") return fallback;
  throw new Error("Invalid side. Use 'a' or 'b'.");
}
