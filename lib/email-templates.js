function wrap(title, body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, system-ui, sans-serif; background: #fde84a; padding: 2rem;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden;">
    <div style="background: #fde84a; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5d520;">
      <h1 style="margin: 0; font-size: 1.1rem; font-weight: 800;">The JOB Board</h1>
    </div>
    <div style="padding: 1.5rem;">
      <h2 style="margin: 0 0 1rem; font-size: 1.2rem;">${title}</h2>
      ${body}
      <p style="margin-top: 1.5rem; color: #666; font-size: 0.85rem;">— The JOB Board</p>
    </div>
  </div>
</body>
</html>`;
}

export function bookingConfirmed(booking, job, bookerName) {
  return {
    subject: `New booking: ${job.title}`,
    html: wrap('You got booked!', `
      <p><strong>${bookerName}</strong> just booked you for <strong>${job.title}</strong>.</p>
      <p>Amount: <strong>$${booking.amount}</strong> (you earn $${booking.worker_amount})</p>
      ${booking.requested_time ? `<p>When: ${new Date(booking.requested_time).toLocaleString()}</p>` : ''}
    `),
  };
}

export function bookingRequested(booking, job, bookerName) {
  return {
    subject: `Booking request: ${job.title}`,
    html: wrap('Someone wants to book you', `
      <p><strong>${bookerName}</strong> sent a booking request for <strong>${job.title}</strong>.</p>
      <p>Amount: <strong>$${booking.amount}</strong></p>
      ${booking.message ? `<p>Their message: "${booking.message}"</p>` : ''}
      <p>Log in to your dashboard to approve or decline.</p>
    `),
  };
}

export function requestApproved(booking, job, providerName) {
  return {
    subject: `Request approved: ${job.title}`,
    html: wrap('You\'re in!', `
      <p><strong>${providerName}</strong> approved your booking request for <strong>${job.title}</strong>.</p>
      <p>Amount: <strong>$${booking.amount}</strong></p>
      ${booking.requested_time ? `<p>When: ${new Date(booking.requested_time).toLocaleString()}</p>` : ''}
    `),
  };
}

export function requestDeclined(booking, job, providerName) {
  return {
    subject: `Request update: ${job.title}`,
    html: wrap('Request not accepted', `
      <p><strong>${providerName}</strong> wasn't able to take your booking for <strong>${job.title}</strong> this time.</p>
      <p>Browse the board for other options — there's always something interesting.</p>
    `),
  };
}

export function bookingCompleted(booking, job, otherName) {
  return {
    subject: `Booking complete: ${job.title}`,
    html: wrap('All done!', `
      <p><strong>${otherName}</strong> marked the booking for <strong>${job.title}</strong> as complete.</p>
      <p>If you had a good experience, leave a review on the job page.</p>
    `),
  };
}

export function bookingCancelled(booking, job, cancellerName, reason) {
  return {
    subject: `Booking cancelled: ${job.title}`,
    html: wrap('Booking cancelled', `
      <p><strong>${cancellerName}</strong> cancelled the booking for <strong>${job.title}</strong>.</p>
      ${reason ? `<p>Reason: "${reason}"</p>` : ''}
    `),
  };
}
