export function profileErrorMessage(error) {
  if (['PGRST205', '42P01', 'PGRST202'].includes(error?.code)) {
    return '로그인은 완료됐지만 회사 연결을 위한 서버 설정이 아직 적용되지 않았습니다. 운영 DB 설정을 확인해 주세요.';
  }
  if (error?.code === 'PGRST116') {
    return '로그인은 완료됐지만 계정의 회사 프로필이 등록되지 않았습니다. 회사 등록과 구성원 연결이 필요합니다.';
  }
  return '로그인은 완료됐지만 회사 프로필을 불러오지 못했습니다. 연결을 확인한 뒤 다시 불러와 주세요.';
}
