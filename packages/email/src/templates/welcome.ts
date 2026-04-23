export function welcomeEmail(params: { displayName: string; portalUrl: string }) {
  const { displayName, portalUrl } = params;
  const text = `
Welkom bij Casella, ${displayName}!

Je bent uitgenodigd om het Ascentra-medewerkerportaal te gebruiken.
Log in met je Microsoft-account via: ${portalUrl}

Zodra je bent ingelogd zie je automatisch je persoonlijke dashboard.

Met vriendelijke groet,
Ascentra HR
  `.trim();

  const html = `
<div style="font-family: system-ui, sans-serif; max-width: 520px; padding: 32px; color: #0e1621;">
  <h1 style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 32px; margin: 0 0 16px;">Welkom bij <em>Casella</em>, ${displayName}!</h1>
  <p style="line-height: 1.6; font-size: 15px;">
    Je bent uitgenodigd om het Ascentra-medewerkerportaal te gebruiken.
    Log in met je Microsoft-account en zie meteen je persoonlijke dashboard.
  </p>
  <p style="margin: 24px 0;">
    <a href="${portalUrl}" style="display: inline-block; background: #7b5cff; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Ga naar Casella
    </a>
  </p>
  <p style="color: rgba(14,22,33,0.45); font-size: 13px;">
    — Ascentra HR
  </p>
</div>
  `.trim();

  return {
    subject: "Welkom bij Casella — Ascentra medewerkerportaal",
    text,
    html,
  };
}
