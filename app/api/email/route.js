import { createClient } from '../../../lib/supabase-server';
import * as templates from '../../../lib/email-templates';

export async function POST(request) {
  const { type, bookingId } = await request.json();

  if (!type || !bookingId) {
    return Response.json({ error: 'Missing type or bookingId' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Email not configured' }, { status: 500 });
  }

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, jobs(title), booker:booker_id(name, email), provider:worker_id(name, email)')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 });
  }

  let email;
  let to;

  switch (type) {
    case 'bookingConfirmed':
      to = booking.provider?.email;
      email = templates.bookingConfirmed(booking, booking.jobs || {}, booking.booker?.name || 'Someone');
      break;
    case 'bookingRequested':
      to = booking.provider?.email;
      email = templates.bookingRequested(booking, booking.jobs || {}, booking.booker?.name || 'Someone');
      break;
    case 'requestApproved':
      to = booking.booker?.email;
      email = templates.requestApproved(booking, booking.jobs || {}, booking.provider?.name || 'Someone');
      break;
    case 'requestDeclined':
      to = booking.booker?.email;
      email = templates.requestDeclined(booking, booking.jobs || {}, booking.provider?.name || 'Someone');
      break;
    case 'bookingCompleted': {
      // Send to the other party (whoever didn't mark it complete)
      // We don't know who triggered it here, so send to both
      const bookerEmail = booking.booker?.email;
      const providerEmail = booking.provider?.email;
      to = bookerEmail;
      email = templates.bookingCompleted(booking, booking.jobs || {}, booking.provider?.name || 'Someone');
      // Send to provider too
      if (providerEmail) {
        const email2 = templates.bookingCompleted(booking, booking.jobs || {}, booking.booker?.name || 'Someone');
        await sendEmail(apiKey, providerEmail, email2.subject, email2.html);
      }
      break;
    }
    case 'bookingCancelled': {
      const cancellerIsBuyer = booking.cancelled_by === booking.booker_id;
      const cancellerName = cancellerIsBuyer ? booking.booker?.name : booking.provider?.name;
      to = cancellerIsBuyer ? booking.provider?.email : booking.booker?.email;
      email = templates.bookingCancelled(booking, booking.jobs || {}, cancellerName || 'Someone', booking.cancel_reason);
      break;
    }
    default:
      return Response.json({ error: 'Unknown email type' }, { status: 400 });
  }

  if (!to) {
    return Response.json({ error: 'No recipient email' }, { status: 400 });
  }

  const result = await sendEmail(apiKey, to, email.subject, email.html);
  return Response.json(result);
}

async function sendEmail(apiKey, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The JOB Board <noreply@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  return res.json();
}
