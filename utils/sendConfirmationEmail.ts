// utils/sendConfirmationEmail.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendConfirmationEmail(name: string, email: string) {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL!, // e.g., "no-reply@nao.health"
    subject: '✅ Hyrox Detroit Registration Confirmed!',
    text: `Hi ${name},\n\nYou're officially registered for the Detroit Hyrox race!\n\nTrain hard and see you there 💪\n\n— The NAO Team`,
    html: `<p>Hi ${name},</p><p>You're officially registered for the <strong>Detroit Hyrox race</strong>!</p><p>Train hard and see you there 💪</p><p>— The NAO Team</p>`
  };

  await sgMail.send(msg);
}
