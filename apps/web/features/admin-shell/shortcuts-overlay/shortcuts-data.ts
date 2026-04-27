export interface ShortcutSection {
  title: string;
  items: { keys: string[]; label: string }[];
}

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "Globaal",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Toon deze sneltoetsen" },
      { keys: ["Esc"], label: "Sluit dialoog of palette" },
    ],
  },
  {
    title: "Formulieren",
    items: [
      { keys: ["⌘", "Enter"], label: "Verstuur formulier" },
      { keys: ["Tab"], label: "Volgend veld" },
      { keys: ["Shift", "Tab"], label: "Vorig veld" },
    ],
  },
  {
    title: "Navigatie",
    items: [
      { keys: ["↑", "↓", "Enter"], label: "In lijst of palette" },
      { keys: ["←", "→", "Home", "End"], label: "In radio-groepen (zoals theme-toggle)" },
    ],
  },
  {
    title: "Entiteiten",
    items: [
      { keys: ["⌘", "N"], label: "Snel nieuwe maken (op lijst-pagina)" },
      { keys: ["⌘", "/"], label: "Focus zoek-pill" },
    ],
  },
];
