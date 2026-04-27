export interface ReminderInput {
  to: string;
  firstName: string | null;
  weekStart: string; // YYYY-MM-DD
  weekEndPretty: string; // "vr 1 mei"
  weekStartPretty: string; // "ma 27 apr"
  hoursAtTime: number;
  appUrl: string;
}

export function reminderEmail(input: ReminderInput): {
  subject: string;
  text: string;
  html: string;
} {
  const name = input.firstName ?? "collega";
  const subject = `Vergeet je niet je uren in te vullen, ${name}?`;
  const link = `${input.appUrl}/uren?week=${input.weekStart}`;
  const text = `Hoi ${name},

Het is bijna weekend. Heb je je uren al ingevuld voor week ${input.weekStartPretty} – ${input.weekEndPretty}?

Op dit moment zien we ${input.hoursAtTime.toFixed(1)} uur. Vul aan via:
${link}

— Casella`;
  const html = `<p>Hoi ${name},</p>
<p>Het is bijna weekend. Heb je je uren al ingevuld voor week <strong>${input.weekStartPretty} – ${input.weekEndPretty}</strong>?</p>
<p>Op dit moment zien we <strong>${input.hoursAtTime.toFixed(1)} uur</strong>.</p>
<p><a href="${link}">Open weekformulier &rarr;</a></p>
<p style="color:#888;font-size:12px;">Casella</p>`;
  return { subject, text, html };
}
