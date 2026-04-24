import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host) throw new Error("SMTP_HOST is niet gezet");
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return _transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "noreply@ascentra.nl";
  await transporter.sendMail({ from, to: input.to, subject: input.subject, html: input.html, text: input.text });
}
