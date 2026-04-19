import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.slice(0, 2)
}

export function getRandomAvatarUrl(): string {
  const seed = Math.floor(Math.random() * 30)
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
