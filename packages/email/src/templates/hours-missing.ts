import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface HoursMissingReminderInput extends SkeletonInput {
  weekLabel: string;
}

export function hoursMissingReminderEmployeeEmail(
  input: HoursMissingReminderInput,
): SkeletonOutput {
  return skeletonEmail(
    `Vergeet je je uren voor ${input.weekLabel}?`,
    `Je hebt nog geen uren ingediend voor ${input.weekLabel}. Vul ze deze week nog in.`,
    "Uren invullen",
    input,
  );
}
