import "server-only";
import { Resend } from "resend";
import { env, hasResend } from "@/config/env";

export interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string | Buffer; contentType?: string }[];
}

export interface MailResult {
  ok: boolean;
  id?: string;
  mode: "resend" | "dev";
  error?: string;
}

/** Development outbox: last 50 mails, inspectable in /admin (memory only). */
const g = globalThis as unknown as { __bolagioOutbox?: Mail[] };
export const devOutbox = () => (g.__bolagioOutbox ??= []);

/**
 * Sends through Resend when configured, otherwise logs to the console and the
 * in-memory outbox. Never throws — a failed email must not break a paid order.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  if (!hasResend()) {
    devOutbox().unshift(mail);
    if (devOutbox().length > 50) devOutbox().pop();
    console.info(`[mail:dev] → ${Array.isArray(mail.to) ? mail.to.join(", ") : mail.to} · ${mail.subject}`);
    return { ok: true, mode: "dev" };
  }
  try {
    const resend = new Resend(env().RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: env().EMAIL_FROM,
      to: mail.to,
      replyTo: mail.replyTo ?? env().EMAIL_REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
    if (error) {
      console.error("[mail] resend error", error);
      return { ok: false, mode: "resend", error: error.message };
    }
    return { ok: true, mode: "resend", id: data?.id };
  } catch (e) {
    console.error("[mail] send failed", e);
    return { ok: false, mode: "resend", error: e instanceof Error ? e.message : "unknown" };
  }
}
