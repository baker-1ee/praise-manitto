function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function toPairs(userIds: string[], shuffled: string[]) {
  return userIds.map((id, idx) => ({ manitoId: id, targetId: shuffled[idx] }))
}

/** excludePairs 셋에 사용할 키 (`manitoId:targetId`) */
export function manitoPairKey(manitoId: string, targetId: string): string {
  return `${manitoId}:${targetId}`
}

/**
 * Fisher-Yates 셔플 기반 마니또 배정
 * 조건: 자기 자신에게 배정 불가 (derangement)
 * `excludePairs`(예: 직전 스프린트 배정)에 해당하는 조합도 함께 회피한다.
 * 인원이 적어 두 조건을 동시에 만족할 수 없는 경우(예: 2인 팀은 서로가 서로의
 * 유일한 배정 대상이라 반복이 불가피함), self-match 회피 조건만 만족하는
 * 배정으로 대체한다.
 */
export function assignManito(
  userIds: string[],
  excludePairs: Set<string> = new Set()
): Array<{ manitoId: string; targetId: string }> {
  if (userIds.length < 2) throw new Error('최소 2명 이상 필요합니다')

  const maxAttempts = 500
  let fallback: string[] | null = null

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const shuffled = shuffle(userIds)
    const isDerangement = shuffled.every((id, idx) => id !== userIds[idx])
    if (!isDerangement) continue
    if (!fallback) fallback = shuffled

    const avoidsExcluded = shuffled.every(
      (id, idx) => !excludePairs.has(manitoPairKey(userIds[idx], id))
    )
    if (avoidsExcluded) return toPairs(userIds, shuffled)
  }

  if (fallback) return toPairs(userIds, fallback)
  throw new Error('마니또 배정에 실패했습니다. 다시 시도해주세요.')
}
