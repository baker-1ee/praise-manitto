function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** excludePairs 셋에 사용할 키 (`manitoId:targetId`) */
export function manitoPairKey(manitoId: string, targetId: string): string {
  return `${manitoId}:${targetId}`
}

/**
 * 팀 인원 수에 따라 최근 몇 개 스프린트의 배정 이력을 회피 대상으로 참고할지 결정한다.
 * N명 팀에서 자기 자신을 제외한 배정 후보는 N-1명이므로, 최근 (N-2)회의 배정을
 * 회피해도 비둘기집 원리에 의해 각자에게 항상 최소 1명의 후보가 남는다.
 * 이보다 더 먼 과거까지 회피하면 후보가 아예 없어져 배정 불가 상황(폴백)만 늘어난다.
 */
export function recentSprintLookback(teamSize: number): number {
  return Math.max(1, teamSize - 2)
}

/**
 * userIds에 대해 자기 자신 제외 + excludePairs 회피 조건을 만족하는 배정을
 * 랜덤 순서 백트래킹으로 탐색한다. 조건을 만족하는 배정이 존재하면 반드시 찾는다.
 */
function findAssignment(
  userIds: string[],
  excludePairs: Set<string>
): Array<{ manitoId: string; targetId: string }> | null {
  const remaining = [...userIds]
  const result: Array<{ manitoId: string; targetId: string }> = []

  function backtrack(i: number): boolean {
    if (i === userIds.length) return true

    const manitoId = userIds[i]
    const candidates = shuffle(
      remaining.filter((t) => t !== manitoId && !excludePairs.has(manitoPairKey(manitoId, t)))
    )

    for (const targetId of candidates) {
      const idx = remaining.indexOf(targetId)
      remaining.splice(idx, 1)
      result.push({ manitoId, targetId })

      if (backtrack(i + 1)) return true

      result.pop()
      remaining.splice(idx, 0, targetId)
    }

    return false
  }

  return backtrack(0) ? result : null
}

/**
 * 마니또 배정. 조건: 자기 자신에게 배정 불가 (derangement).
 * `excludePairs`(최근 n개 스프린트의 manito→target 조합)도 함께 회피한다.
 * 팀 인원이 적어 두 조건을 동시에 만족할 수 없는 경우(예: 2인 팀은 서로가
 * 서로의 유일한 배정 대상이라 반복이 불가피함), self-match 회피 조건만
 * 만족하는 배정으로 안전하게 대체한다.
 */
export function assignManito(
  userIds: string[],
  excludePairs: Set<string> = new Set()
): Array<{ manitoId: string; targetId: string }> {
  if (userIds.length < 2) throw new Error('최소 2명 이상 필요합니다')

  const shuffledIds = shuffle(userIds)
  const withHistory = findAssignment(shuffledIds, excludePairs)
  if (withHistory) return withHistory

  const derangementOnly = findAssignment(shuffledIds, new Set())
  if (derangementOnly) return derangementOnly

  throw new Error('마니또 배정에 실패했습니다. 다시 시도해주세요.')
}
