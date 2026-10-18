# 거래처 원본의 비공개 클라우드 이관

관련: S03 → S11/S16 → S17. 기존 65개 거래처의 source_client_id를 managed_client_links로 회사 UUID에 대응시킨다. 기존123개 파일은 Git/배포 번들에 포함하지 않는다.

`scripts/migrate-client-files.mjs`는 기본 dry-run이다. 실행 시 환경변수로 기존 계정의 비밀번호를 받고 일반 인증 JWT/RLS로 업로드한다. 서비스 키·공개 버킷·권한 확대를 사용하지 않는다. 회사/원본ID 기반 고정 문서 UUID, 원본 SHA-256, 별도 버전 UUID로 재실행 중복을 방지한다. 원본 변경은 기존 객체와 해시 충돌로 실패해 자동 덮어쓰지 않는다. 업로드 후 다운로드 해시가 일치하고 버전 이력 저장이 성공해야 complete로 표시한다. 실패는 로컬 비공개 cloud-migration-report.json에 남긴다.

원본은 `companies/{companyId}/{documentId}/original.ext`, 변환 미리보기는 같은 폴더 preview.pdf/html이다. HTML 소스는 text/plain으로 보관하며 뷰어에서 CSP와 빈 sandbox로 스크립트/외부통신 없이 렌더링한다. PDF는 원본 또는 원문 해시와 연결된 변환 PDF다. 원본·미리보기 접근은10분 서명 URL과 회사 RLS를 사용한다. 문서 목록에 회사 UUID를 전달하고 회사 전환 시 열린 뷰어를 닫는다.

보관 문서는 CLIENT_FILE·standards=[]·DRAFT이며 ISO 준비 완료나 인증 증거로 간주하지 않는다. 본문 추출본과 원본 레이아웃을 구분한다. 원본 다운로드·미리보기·전체 본문을 제공한다. 100MiB 버킷 제한과 프로젝트 공통 제한이 모두 충족되어야 대용량 원본 이관이 가능하다.
