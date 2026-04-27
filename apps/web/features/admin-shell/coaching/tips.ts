export interface Tip {
  id: string;
  trigger: {
    actionKey: string;
    threshold: number;
    withoutActionKey?: string;
  };
  copy: string;
}

export const TIPS: Tip[] = [
  {
    id: "cmdN-quick-create",
    trigger: {
      actionKey: "clickedNewEmployeeButton",
      threshold: 5,
      withoutActionKey: "usedCmdN",
    },
    copy: "💡 Snelkoppeling: druk op ⌘N om snel een nieuwe medewerker te maken.",
  },
  {
    id: "shortcuts-overlay",
    trigger: {
      actionKey: "opens",
      threshold: 10,
      withoutActionKey: "usedShortcutsOverlay",
    },
    copy: "💡 Druk op ? voor een overzicht van alle sneltoetsen.",
  },
];
