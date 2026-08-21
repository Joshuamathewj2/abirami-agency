export const BEDSPREAD_COLORS: Record<string, string> = {
  "1": "Aqua Blue",
  "2": "Tan",
  "3": "Olive Green",
  "4": "Color Option 4", 
  "5": "Skyblue",
  "6": "Lavender",
  "7": "Light Green",
  "8": "Yellow"
};

export const getColorName = (index: number | string) => {
  return BEDSPREAD_COLORS[String(index)] || `Color Option ${index}`;
};
