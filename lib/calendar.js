const DURATION_HOURS = {
  hourly: 1,
  half_day: 4,
  day: 8,
  week: 40,
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatICSDate(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
}

export function generateICS(booking, job) {
  const start = new Date(booking.requested_time);
  const hours = DURATION_HOURS[booking.rate_type] || 1;
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JOB Board//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${job.title}`,
    `DESCRIPTION:Booking on The JOB Board - $${booking.amount}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'booking.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarURL(booking, job) {
  const start = new Date(booking.requested_time);
  const hours = DURATION_HOURS[booking.rate_type] || 1;
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: job.title,
    dates: `${formatICSDate(start)}/${formatICSDate(end)}`,
    details: `Booking on The JOB Board - $${booking.amount}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
