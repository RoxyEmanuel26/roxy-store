/**
 * Returns the start of the day in WIB (GMT+7) as a UTC Date object.
 * This ensures that timezone differences do not skew today's statistics.
 */
export function getWibToday(): Date {
    const now = new Date()
    // WIB is UTC+7, adjust UTC time to get the wall-clock time in WIB
    const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    wibTime.setUTCHours(0, 0, 0, 0)
    // Convert back to UTC timezone by subtracting 7 hours
    return new Date(wibTime.getTime() - 7 * 60 * 60 * 1000)
}

/**
 * Returns the start of a given date (defaulting to now) in WIB as a UTC Date.
 */
export function getWibStartOfDay(date: Date = new Date()): Date {
    const wibTime = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    wibTime.setUTCHours(0, 0, 0, 0)
    return new Date(wibTime.getTime() - 7 * 60 * 60 * 1000)
}
