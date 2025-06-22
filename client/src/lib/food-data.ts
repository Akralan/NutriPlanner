import { convertCSVToAppFormat } from './csv-parser';

// Get data from CSV
const csvData = convertCSVToAppFormat();

export const foodCategories = csvData.categories;

export const seasons = [
  { id: "all", name: "Toutes saisons", emoji: "🌱" },
  { id: "spring", name: "Printemps", emoji: "🌸" },
  { id: "summer", name: "Été", emoji: "☀️" },
  { id: "autumn", name: "Automne", emoji: "🍂" },
  { id: "winter", name: "Hiver", emoji: "❄️" },
];
