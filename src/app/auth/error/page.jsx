import Link from 'next/link';

export default function AuthErrorPage() {
  return <main className="m-auto max-w-md p-8 bg-white rounded-2xl shadow-sm">
    <h1 className="text-xl font-bold mb-3">로그인을 완료하지 못했습니다</h1>
    <p className="text-sm text-slate-600 mb-5">로그인을 취소했거나 연결 시간이 만료되었습니다. 로그인을 시작한 브라우저에서 다시 시도해 주세요. 기존 계정은 이메일과 비밀번호로 로그인할 수 있습니다.</p>
    <Link href="/dashboard" className="text-blue-700 underline">어니스톤으로 돌아가기</Link>
  </main>;
}
