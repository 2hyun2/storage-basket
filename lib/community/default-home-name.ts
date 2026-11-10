// 가입 트리거(supabase/migrations/202610300001_complete_community_join.sql)가 만드는
// 기본 공동체 이름 `left(표시 이름, 52) || '의 수납바구니'`와 같은 규칙이다.
export const DEFAULT_HOME_NAME_SUFFIX = '의 수납바구니'

export function defaultHomeName(displayName: string) {
  return Array.from(displayName.trim()).slice(0, 52).join('') + DEFAULT_HOME_NAME_SUFFIX
}

// 공동체 이름이 후보 이름 중 하나로 만든 기본 이름 그대로인지 확인한다.
// 사용자가 직접 바꾼 이름은 false가 되어 자동 변경 대상에서 빠진다.
export function isDefaultHomeName(homeName: string, candidateNames: Array<string | null | undefined>) {
  return candidateNames.some((candidate) => Boolean(candidate?.trim()) && homeName === defaultHomeName(candidate!))
}
