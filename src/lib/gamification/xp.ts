// XP and Level calculations

// XP required for each level (exponential curve)
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(50 * Math.pow(level - 1, 1.5))
}

// Calculate level from total XP
export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) {
    level++
  }
  return level
}

// XP progress within current level (0-100%)
export function levelProgress(xp: number): number {
  const currentLevel = levelFromXp(xp)
  const currentLevelXp = xpForLevel(currentLevel)
  const nextLevelXp = xpForLevel(currentLevel + 1)

  if (nextLevelXp === currentLevelXp) return 100

  return Math.floor(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
}

// Calculate XP earned from a conversation score
export function xpFromScore(score: number): number {
  // Base XP: 10-50 based on score
  // Score 0-49: 10 XP
  // Score 50-69: 20 XP
  // Score 70-79: 30 XP
  // Score 80-89: 40 XP
  // Score 90-100: 50 XP
  if (score >= 90) return 50
  if (score >= 80) return 40
  if (score >= 70) return 30
  if (score >= 50) return 20
  return 10
}

// Bonus XP multipliers
export function calculateTotalXp(
  baseXp: number,
  options: {
    isFirstConversation?: boolean
    streakDays?: number
    difficulty?: 'easy' | 'medium' | 'hard'
  } = {}
): number {
  let total = baseXp

  // First conversation bonus
  if (options.isFirstConversation) {
    total += 25
  }

  // Streak bonus (5% per streak day, max 50%)
  if (options.streakDays && options.streakDays > 0) {
    const streakBonus = Math.min(options.streakDays * 0.05, 0.5)
    total = Math.floor(total * (1 + streakBonus))
  }

  // Difficulty bonus
  if (options.difficulty === 'hard') {
    total = Math.floor(total * 1.5)
  } else if (options.difficulty === 'medium') {
    total = Math.floor(total * 1.25)
  }

  return total
}

// Level titles
export function levelTitle(level: number): string {
  if (level >= 50) return 'Communication Legend'
  if (level >= 40) return 'Master Negotiator'
  if (level >= 30) return 'Senior Communicator'
  if (level >= 20) return 'Skilled Professional'
  if (level >= 15) return 'Rising Star'
  if (level >= 10) return 'Confident Speaker'
  if (level >= 5) return 'Apprentice'
  return 'Beginner'
}
