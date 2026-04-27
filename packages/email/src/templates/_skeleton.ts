export interface SkeletonInput {
  to: string;
  recipientName: string;
  appUrl: string;
  ctaPath: string;
}

export interface SkeletonOutput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function skeletonEmail(
  subject: string,
  body: string,
  ctaLabel: string,
  input: SkeletonInput,
): SkeletonOutput {
  const link = `${input.appUrl}${input.ctaPath}`;
  return {
    to: input.to,
    subject,
    text: `Hoi ${input.recipientName},

${body}

${ctaLabel}: ${link}

— Casella`,
    html: `<p>Hoi ${input.recipientName},</p>
<p>${body}</p>
<p><a href="${link}">${ctaLabel} &rarr;</a></p>
<p style="color:#888;font-size:12px;">Casella</p>`,
  };
}
