import confetti from 'canvas-confetti'

export function fireConfetti() {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 }, colors })
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors }), 150)
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors }), 300)
}
