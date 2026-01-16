/**
 * Working Hours / Geschäftszeiten Logik
 */

interface OfficeHours {
  enabled: boolean
  timezone: string
  schedule: {
    [day: string]: {
      enabled: boolean
      start: string  // "09:00"
      end: string    // "18:00"
    }
  }
}

interface WorkingHoursResult {
  isOpen: boolean
  currentDay: string
  currentTime: string
  nextOpenTime?: string
  message?: string
  timezone: string
}

const DAY_NAMES: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const DAY_NAMES_DE: Record<string, string> = {
  sunday: 'Sonntag',
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
}

/**
 * Prüft ob aktuell Geschäftszeit ist
 */
export function checkWorkingHours(officeHours: OfficeHours | null): WorkingHoursResult {
  const defaultTimezone = 'Europe/Berlin'

  // Wenn keine Office Hours konfiguriert, immer offen
  if (!officeHours || !officeHours.enabled) {
    return {
      isOpen: true,
      currentDay: getCurrentDayName(),
      currentTime: getCurrentTime(defaultTimezone),
      timezone: defaultTimezone,
    }
  }

  const timezone = officeHours.timezone || 'Europe/Berlin'
  const now = new Date()

  // Konvertiere zu der konfigurierten Zeitzone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  })

  const parts = formatter.formatToParts(now)
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || 'monday'
  const hour = parts.find(p => p.type === 'hour')?.value || '12'
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  const currentTime = `${hour}:${minute}`

  const todaySchedule = officeHours.schedule[weekday]

  // Wenn heute nicht konfiguriert oder deaktiviert
  if (!todaySchedule || !todaySchedule.enabled) {
    const nextOpen = findNextOpenTime(officeHours, weekday)
    return {
      isOpen: false,
      currentDay: weekday,
      currentTime,
      nextOpenTime: nextOpen,
      message: generateClosedMessage(nextOpen),
      timezone,
    }
  }

  // Prüfe ob aktuelle Zeit innerhalb der Geschäftszeiten liegt
  const isWithinHours = isTimeBetween(currentTime, todaySchedule.start, todaySchedule.end)

  if (isWithinHours) {
    return {
      isOpen: true,
      currentDay: weekday,
      currentTime,
      timezone,
    }
  }

  // Außerhalb der Geschäftszeiten
  const nextOpen = isTimeAfter(currentTime, todaySchedule.end)
    ? findNextOpenTime(officeHours, weekday)
    : `heute um ${todaySchedule.start} Uhr`

  return {
    isOpen: false,
    currentDay: weekday,
    currentTime,
    nextOpenTime: nextOpen,
    message: generateClosedMessage(nextOpen),
    timezone,
  }
}

/**
 * Prüft ob eine Zeit zwischen Start und Ende liegt
 */
function isTimeBetween(current: string, start: string, end: string): boolean {
  const [currentH, currentM] = current.split(':').map(Number)
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  const currentMinutes = currentH * 60 + currentM
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * Prüft ob eine Zeit nach einer anderen liegt
 */
function isTimeAfter(current: string, compare: string): boolean {
  const [currentH, currentM] = current.split(':').map(Number)
  const [compareH, compareM] = compare.split(':').map(Number)

  const currentMinutes = currentH * 60 + currentM
  const compareMinutes = compareH * 60 + compareM

  return currentMinutes >= compareMinutes
}

/**
 * Findet die nächste Öffnungszeit
 */
function findNextOpenTime(officeHours: OfficeHours, currentDay: string): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const currentIndex = days.indexOf(currentDay)

  // Prüfe die nächsten 7 Tage
  for (let i = 1; i <= 7; i++) {
    const nextIndex = (currentIndex + i) % 7
    const nextDay = days[nextIndex]
    const schedule = officeHours.schedule[nextDay]

    if (schedule?.enabled) {
      const dayName = DAY_NAMES_DE[nextDay] || nextDay
      return `${dayName} um ${schedule.start} Uhr`
    }
  }

  return 'bald'
}

/**
 * Generiert eine "Geschlossen"-Nachricht
 */
function generateClosedMessage(nextOpen?: string): string {
  const messages = [
    `Vielen Dank für deine Nachricht! Wir sind gerade nicht erreichbar, aber wir melden uns ${nextOpen || 'so schnell wie möglich'} bei dir.`,
    `Hey! Leider sind wir gerade außerhalb unserer Geschäftszeiten. Wir antworten dir ${nextOpen || 'sobald wir wieder da sind'}.`,
    `Danke für deine Nachricht! Wir sind ${nextOpen ? `wieder ${nextOpen}` : 'bald wieder'} für dich da.`,
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Hilfsfunktion: Aktueller Tag
 */
function getCurrentDayName(): string {
  return DAY_NAMES[new Date().getDay()]
}

/**
 * Hilfsfunktion: Aktuelle Zeit
 */
function getCurrentTime(timezone: string): string {
  return new Date().toLocaleTimeString('de-DE', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Standard Office Hours Template
 */
export function getDefaultOfficeHours(): OfficeHours {
  return {
    enabled: false,
    timezone: 'Europe/Berlin',
    schedule: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '10:00', end: '14:00' },
      sunday: { enabled: false, start: '10:00', end: '14:00' },
    },
  }
}

/**
 * Berechnet den nächsten Werktag um 08:00 Uhr
 * (Mo-Fr, 08:00 in der angegebenen Zeitzone)
 */
export function getNextBusinessDay8AM(timezone: string = 'Europe/Berlin'): Date {
  const now = new Date()

  // Get current time in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024')
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12')

  // Create a date in the local timezone
  const localDate = new Date(year, month, day, 8, 0, 0, 0)

  // Check if today is still valid (before 08:00 and weekday)
  const dayOfWeek = localDate.getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isBeforeOpen = hour < 8

  if (isWeekday && isBeforeOpen) {
    // Today at 08:00 is fine
    return localDate
  }

  // Find next weekday
  let daysToAdd = 1
  let nextDay = new Date(localDate)
  nextDay.setDate(nextDay.getDate() + daysToAdd)

  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    daysToAdd++
    nextDay = new Date(localDate)
    nextDay.setDate(nextDay.getDate() + daysToAdd)
  }

  nextDay.setHours(8, 0, 0, 0)
  return nextDay
}
