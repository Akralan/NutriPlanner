export interface Season {
  id: string;
  name: string;
  emoji: string;
}

export const seasons: Season[] = [
  { id: "all", name: "Toutes saisons", emoji: "🌱" },
  { id: "spring", name: "Printemps", emoji: "🌸" },
  { id: "summer", name: "Été", emoji: "☀️" },
  { id: "autumn", name: "Automne", emoji: "🍂" },
  { id: "winter", name: "Hiver", emoji: "❄️" },
];
