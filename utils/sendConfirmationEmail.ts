import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendConfirmationEmail(name: string, email: string) {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL!, // e.g., "no-reply@nao.health"
    subject: '✅ PREMETEAM HYROX Registration Confirmed — August 17th',
    text: `Hi ${name},

You're officially registered for the PREMETEAM HYROX Race Day!

Event Details:
Date: Saturday, August 17th, 2025
Start Time: 8:00 AM
Location: PREMETEAM — 778 West Maple, Suite B, Troy, MI 48084

Race Format:
Each station is separated by a 1km run:
- 1,000m Row
- 100m Burpee Broad Jump
- 200m Farmer's Carry
- 100m Weighted Walking Lunge
- 100 Wall Balls

Doubles + Pro Heats: Assigned 3 weeks before race day.

How to Earn Rewards:
You're now part of NAO. Log your workouts, track your progress, and earn real $NAO stablecoin — redeemable via Apple Pay, Mastercard, or Crypto.

Start earning now: https://naoverse.io/mint

See you on race day.

— The PREMETEAM & NAO Team`,
    
    html: `
    <p>Hi ${name},</p>

    <h2>You're officially registered for the <strong>PREMETEAM HYROX Race Day!</strong></h2>

    <h3>Event Details:</h3>
    <ul>
      <li><strong>Date:</strong> Saturday, August 17th, 2025</li>
      <li><strong>Start Time:</strong> 8:00 AM</li>
      <li><strong>Location:</strong> PREMETEAM — 778 West Maple, Suite B, Troy, MI 48084</li>
    </ul>

    <h3>Race Format:</h3>
    <p>Each station is separated by a 1km run:</p>
    <ul>
      <li>1,000m Row</li>
      <li>100m Burpee Broad Jump</li>
      <li>200m Farmer's Carry</li>
      <li>100m Weighted Walking Lunge</li>
      <li>100 Wall Balls</li>
    </ul>

    <p><strong>Doubles + Pro Heats:</strong> Assigned 3 weeks before race day.</p>

    <h3>How to Earn Rewards with NAO:</h3>
    <p>You're now part of NAO. Log your workouts, track your progress, and earn real $NAO stablecoin — redeemable via Apple Pay, Mastercard, or Crypto.</p>

    <p><a href="https://naoverse.io/mint">Start earning now →</a></p>

    <p>See you on race day!</p>

    <p>— The PREMETEAM & NAO Team</p>`
  };

  await sgMail.send(msg);
}
