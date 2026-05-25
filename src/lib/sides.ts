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
    label: "Team Kamal",
    shortLabel: "Kamal",
    teamName: "KAMAL",
    tagline: "BUILD THE NATION",
    description: "Buy pixels. Reveal the lotus.",
    color: "kamal",
    symbol: "🪷",
    symbolLabel: "lotus",
  },
  b: {
    id: "b",
    label: "Team Cockroach",
    shortLabel: "Cockroach",
    teamName: "COCKROACH",
    tagline: "SPREAD THE ROT",
    description: "Buy pixels. Reveal the swarm.",
    color: "cockroach",
    symbol: "🪳",
    symbolLabel: "cockroach",
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
