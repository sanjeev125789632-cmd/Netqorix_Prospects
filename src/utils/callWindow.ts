export interface CallWindowStatus {
  isCallNow: boolean;
  statusText: 'Call now' | 'Outside window';
  reason: string;
  badgeClass: string;
  istTimeString: string;
}

/**
 * Returns current Date in Indian Standard Time (UTC+05:30)
 */
export function getISTDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

/**
 * Formats current IST time for display
 */
export function formatISTTime(date: Date = getISTDate()): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayName} ${hours}:${minutes} IST`;
}

/**
 * Evaluates whether current IST time is inside the prospect's Best Call Window
 */
export function evaluateCallWindow(
  windowStr: string,
  segment?: string,
  refDate: Date = getISTDate()
): CallWindowStatus {
  const istTimeString = formatISTTime(refDate);
  const text = (windowStr || '').trim();

  if (!text) {
    return {
      isCallNow: false,
      statusText: 'Outside window',
      reason: 'No call window specified',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      istTimeString
    };
  }

  const dayOfWeek = refDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const month = refDate.getMonth(); // 0=Jan, 8=Sep, 9=Oct
  const dayOfMonth = refDate.getDate();

  // Rule: "not before 1 Oct"
  if (text.toLowerCase().includes('not before 1 oct')) {
    // If before October 1st
    if (month < 9) {
      return {
        isCallNow: false,
        statusText: 'Outside window',
        reason: 'Window inactive until 1 Oct (seasonal pause)',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/50',
        istTimeString
      };
    }
  }

  // Rule: "never Fri-Sun" or Food & Events strict weekend avoidance
  const isFoodAndEvents = segment && segment.toLowerCase().includes('food');
  const neverFriSun = text.toLowerCase().includes('never fri-sun') || isFoodAndEvents;

  if (neverFriSun && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
    return {
      isCallNow: false,
      statusText: 'Outside window',
      reason: 'Weekend rush / Fri-Sun blocked for Food & Events',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/50',
      istTimeString
    };
  }

  // Check Day Range (e.g. "Tue-Thu")
  let dayAllowed = false;
  if (text.startsWith('Tue-Thu')) {
    dayAllowed = dayOfWeek >= 2 && dayOfWeek <= 4; // Tue, Wed, Thu
  } else if (text.startsWith('Mon-Fri')) {
    dayAllowed = dayOfWeek >= 1 && dayOfWeek <= 5;
  } else if (text.startsWith('Mon-Sat')) {
    dayAllowed = dayOfWeek >= 1 && dayOfWeek <= 6;
  } else {
    // Default to Tue-Thu if not otherwise indicated
    dayAllowed = dayOfWeek >= 2 && dayOfWeek <= 4;
  }

  if (!dayAllowed) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      isCallNow: false,
      statusText: 'Outside window',
      reason: `Today is ${dayNames[dayOfWeek]} (Window is Tue–Thu)`,
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      istTimeString
    };
  }

  // Time Range Parsing: extract patterns like "11:00-13:00" and "15:00-17:00"
  const timeRangeRegex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
  const currentMinutes = refDate.getHours() * 60 + refDate.getMinutes();

  let isInsideTimeRange = false;
  let matchedRange = '';
  let match: RegExpExecArray | null;

  while ((match = timeRangeRegex.exec(text)) !== null) {
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);

    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      isInsideTimeRange = true;
      matchedRange = `${match[1]}:${match[2]}–${match[3]}:${match[4]}`;
      break;
    }
  }

  if (isInsideTimeRange) {
    return {
      isCallNow: true,
      statusText: 'Call now',
      reason: `Current IST time is within window (${matchedRange})`,
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-semibold',
      istTimeString
    };
  }

  return {
    isCallNow: false,
    statusText: 'Outside window',
    reason: `Outside scheduled hours today (${formatISTTime(refDate).split(' ')[1]} IST)`,
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300/60 dark:border-amber-800/40',
    istTimeString
  };
}
