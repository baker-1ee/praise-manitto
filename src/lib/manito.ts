const EXACT_SOLVE_MAX_SIZE = 8
const HEURISTIC_RESTART_COUNT = 10
const HALF_LIFE_SPRINTS = 2

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 이력 가중치 맵의 키 (순서 무관 — 같은 두 사람이 어느 방향으로 배정됐든 동일하게 취급) */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

/**
 * 팀 인원 수에 따라 몇 개 스프린트의 배정 이력을 가중치 계산에 반영할지 결정한다.
 * M(N) = clamp(⌈(N-1)/2⌉, 3, 20). 지수 감쇠(half-life ≈ 2스프린트)로 반영하므로
 * 이 창 밖의 이력은 가중치가 사실상 0에 수렴해 하드 컷오프처럼 작동하지 않는다 —
 * 조회량과 계산 비용의 상한을 두기 위한 값일 뿐, 배정 가능 여부를 좌우하지 않는다.
 */
export function recentSprintLookback(teamSize: number): number {
  const half = Math.ceil((teamSize - 1) / 2)
  return Math.min(20, Math.max(3, half))
}

/**
 * 최근 스프린트들(최신순)의 manito↔target 쌍에 지수 감쇠 가중치를 누적한다.
 * 가중치 = 0.5 ^ ((몇 스프린트 전인가 - 1) / halfLifeSprints) — 최근일수록 무겁게,
 * 오래될수록 부드럽게 잊혀진다. 현재 팀원 목록에 둘 다 남아있는 쌍만 반영하므로
 * 탈퇴자는 자동 제외되고, 신규 합류자는 이력이 없어 가중치 0(최우선 배정 후보)이 된다.
 */
export function computePairWeights(
  recentSprintsMostRecentFirst: Array<{ pairs: Array<{ manitoId: string; targetId: string }> }>,
  currentMemberIds: string[],
  halfLifeSprints: number = HALF_LIFE_SPRINTS
): Map<string, number> {
  const members = new Set(currentMemberIds)
  const weights = new Map<string, number>()

  recentSprintsMostRecentFirst.forEach((sprint, index) => {
    const sprintsAgo = index + 1
    const weight = Math.pow(0.5, (sprintsAgo - 1) / halfLifeSprints)

    for (const { manitoId, targetId } of sprint.pairs) {
      if (!members.has(manitoId) || !members.has(targetId)) continue
      const key = pairKey(manitoId, targetId)
      weights.set(key, (weights.get(key) ?? 0) + weight)
    }
  })

  return weights
}

function edgeWeight(a: string, b: string, weights: Map<string, number>): number {
  return weights.get(pairKey(a, b)) ?? 0
}

function cycleCost(cycle: string[], weights: Map<string, number>): number {
  let cost = 0
  for (let i = 0; i < cycle.length; i++) {
    cost += edgeWeight(cycle[i], cycle[(i + 1) % cycle.length], weights)
  }
  return cost
}

/** N-1명을 전수 순열 탐색해 비용이 최소인 순환을 찾는다 (N ≤ 8, 완전 최적해). */
function solveExact(userIds: string[], weights: Map<string, number>): string[] {
  const [first, ...rest] = userIds
  let best: string[] = [first, ...rest]
  let bestCost = Infinity

  function permute(k: number) {
    if (k === rest.length) {
      const candidate = [first, ...rest]
      const cost = cycleCost(candidate, weights)
      if (cost < bestCost) {
        bestCost = cost
        best = candidate
      }
      return
    }
    for (let i = k; i < rest.length; i++) {
      ;[rest[k], rest[i]] = [rest[i], rest[k]]
      permute(k + 1)
      ;[rest[k], rest[i]] = [rest[i], rest[k]]
    }
  }

  permute(0)
  return best
}

/** 현재 노드에서 가중치가 가장 낮은 미방문 노드로 계속 연결하는 그리디 순환 구성. */
function nearestNeighborCycle(userIds: string[], start: string, weights: Map<string, number>): string[] {
  const remaining = new Set(userIds)
  remaining.delete(start)
  const cycle = [start]
  let current = start

  while (remaining.size > 0) {
    let next: string | null = null
    let lowest = Infinity
    for (const candidate of remaining) {
      const w = edgeWeight(current, candidate, weights)
      if (w < lowest) {
        lowest = w
        next = candidate
      }
    }
    cycle.push(next!)
    remaining.delete(next!)
    current = next!
  }

  return cycle
}

/** 두 구간을 뒤집어서 비용이 줄면 채택, 더 이상 개선이 없을 때까지 반복. */
function twoOpt(initialCycle: string[], weights: Map<string, number>): string[] {
  const n = initialCycle.length
  const cycle = [...initialCycle]
  let improved = true

  while (improved) {
    improved = false
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = cycle[i]
        const b = cycle[(i + 1) % n]
        const c = cycle[j]
        const d = cycle[(j + 1) % n]
        if (a === c || b === d) continue

        const before = edgeWeight(a, b, weights) + edgeWeight(c, d, weights)
        const after = edgeWeight(a, c, weights) + edgeWeight(b, d, weights)

        if (after < before) {
          let lo = i + 1
          let hi = j
          while (lo < hi) {
            ;[cycle[lo], cycle[hi]] = [cycle[hi], cycle[lo]]
            lo++
            hi--
          }
          improved = true
        }
      }
    }
  }

  return cycle
}

/** 무작위 시작점 최대 10개 각각 그리디 구성 + 2-opt, 그중 최저 비용 채택 (N > 8). */
function solveHeuristic(userIds: string[], weights: Map<string, number>): string[] {
  const starts = shuffle(userIds).slice(0, Math.min(HEURISTIC_RESTART_COUNT, userIds.length))

  let best: string[] = userIds
  let bestCost = Infinity

  for (const start of starts) {
    const greedy = nearestNeighborCycle(userIds, start, weights)
    const optimized = twoOpt(greedy, weights)
    const cost = cycleCost(optimized, weights)
    if (cost < bestCost) {
      bestCost = cost
      best = optimized
    }
  }

  return best
}

function cycleToPairs(cycle: string[]): Array<{ manitoId: string; targetId: string }> {
  return cycle.map((manitoId, i) => ({
    manitoId,
    targetId: cycle[(i + 1) % cycle.length],
  }))
}

/**
 * 마니또 배정. 팀 전체가 반드시 하나의 순환(Hamiltonian cycle)을 이루도록 강제한다 —
 * 순환은 인접 원소가 모두 서로 달라 derangement(자기 자신 배정 불가)를 구조적으로
 * 만족하며, 2인 상호 배정 같은 부분 순환도 발생하지 않는다.
 * `pairWeights`(최근 이력의 지수 감쇠 가중치, `computePairWeights` 참고)가 낮은
 * 조합일수록 우선 연결되도록 비용을 최소화하는 순환을 찾는다.
 * N ≤ 8은 전수 탐색으로 완전 최적해, N > 8은 그리디 다중 시작 + 2-opt로 근사한다.
 */
export function assignManito(
  userIds: string[],
  pairWeights: Map<string, number> = new Map()
): Array<{ manitoId: string; targetId: string }> {
  if (userIds.length < 2) throw new Error('최소 2명 이상 필요합니다')

  const shuffled = shuffle(userIds)
  const cycle =
    shuffled.length <= EXACT_SOLVE_MAX_SIZE
      ? solveExact(shuffled, pairWeights)
      : solveHeuristic(shuffled, pairWeights)

  return cycleToPairs(cycle)
}
