// Streak calculation utilities

// Check if a date is today
function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Check if a date is yesterday
function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

// Calculate new streak values after a practice session
export function updateStreak(
  currentStreak: number,
  longestStreak: number,
  lastPracticeDate: string | null
): {
  newStreak: number
  newLongestStreak: number
  streakIncreased: boolean
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // If no previous practice, start streak at 1
  if (!lastPracticeDate) {
    return {
      newStreak: 1,
      newLongestStreak: Math.max(longestStreak, 1),
      streakIncreased: true,
    }
  }

  const lastDate = new Date(lastPracticeDate)
  lastDate.setHours(0, 0, 0, 0)

  // If already practiced today, no change
  if (isToday(lastDate)) {
    return {
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
      streakIncreased: false,
    }
  }

  // If practiced yesterday, increment streak
  if (isYesterday(lastDate)) {
    const newStreak = currentStreak + 1
    return {
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      streakIncreased: true,
    }
  }

  // Streak broken - start fresh
  return {
    newStreak: 1,
    newLongestStreak: longestStreak,
    streakIncreased: true,
  }
}

// Get streak status message
export function streakMessage(streak: number): string {
  if (streak >= 30) return 'Incredible dedication!'
  if (streak >= 14) return 'You\'re on fire!'
  if (streak >= 7) return 'One week strong!'
  if (streak >= 3) return 'Keep it going!'
  if (streak >= 1) return 'Great start!'
  return 'Start your streak today!'
}

// Check if streak is at risk (didn't practice yet today and practiced yesterday)
export function isStreakAtRisk(lastPracticeDate: string | null): boolean {
  if (!lastPracticeDate) return false

  const lastDate = new Date(lastPracticeDate)
  return isYesterday(lastDate)
}
