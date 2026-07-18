import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {
    const host = this.config.get<string>('mail.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port'),
        secure: this.config.get<boolean>('mail.secure'),
        auth: this.config.get<string>('mail.user')
          ? {
              user: this.config.get<string>('mail.user'),
              pass: this.config.get<string>('mail.pass'),
            }
          : undefined,
      });
    } else {
      this.logger.warn(
        'MAIL_HOST is not configured — outgoing emails will be logged to the console instead of sent.',
      );
    }
  }

  // `lang` is the recipient's active session/preferred language ('en' | 'ar'),
  // so the whole email — subject, copy, and layout direction — matches what
  // they were seeing in the app when they requested the reset.
  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    resetLink: string;
    lang: 'en' | 'ar';
  }) {
    const { to, name, resetLink, lang } = params;
    const t = (key: string, args?: Record<string, unknown>) =>
      this.i18n.translate(`email.${key}`, { lang, args });

    const subject = t('RESET_SUBJECT');
    const html = this.buildResetEmailHtml({ name, resetLink, lang, t });

    await this.send({ to, subject, html });
  }

  private buildResetEmailHtml(params: {
    name: string;
    resetLink: string;
    lang: 'en' | 'ar';
    t: (key: string, args?: Record<string, unknown>) => string;
  }) {
    const { name, resetLink, lang, t } = params;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const align = lang === 'ar' ? 'right' : 'left';

    const preheader = t('RESET_PREHEADER');
    const greeting = t('RESET_GREETING', { name });
    const intro = t('RESET_INTRO');
    const button = t('RESET_BUTTON');
    const linkFallback = t('RESET_LINK_FALLBACK');
    const expiry = t('RESET_EXPIRY_NOTICE');
    const ignore = t('RESET_IGNORE_NOTICE');
    const footer = t('RESET_FOOTER');

    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${preheader}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f3;font-family:Segoe UI,Tahoma,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f3;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" dir="${dir}"
          style="background:#ffffff;border-radius:8px;overflow:hidden;text-align:${align};">
          <tr>
            <td style="background:#2f5d50;padding:20px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:600;">DMS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1f2421;">
              <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a4f4b;">${intro}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:6px;background:#2f5d50;">
                    <a href="${resetLink}" target="_blank"
                      style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;">
                      ${button}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#6b706c;">${linkFallback}</p>
              <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
                <a href="${resetLink}" style="color:#2f5d50;">${resetLink}</a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#6b706c;">${expiry}</p>
              <p style="margin:0;font-size:13px;color:#6b706c;">${ignore}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f4f5f3;">
              <p style="margin:0;font-size:11px;color:#9a9e9a;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private async send(params: { to: string; subject: string; html: string }) {
    const { to, subject, html } = params;

    if (!this.transporter) {
      // Dev fallback: no SMTP configured, so surface the email in the logs
      // instead of silently dropping it.
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('mail.from'),
        to,
        subject,
        html,
      });
    } catch (err) {
      // A failed send shouldn't leak whether the account exists or expose
      // SMTP errors to the client — just log it server-side.
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${reason}`);
    }
  }
}
