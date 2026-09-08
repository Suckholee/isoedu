import './globals.css';

export const metadata = {
  title: '인증 레이더 (Certification Radar) - ISOEdu',
  description: '체계적인 인증 문서 관리 & AI 어시스턴트 기반 상황별 규격 문서 자동 호출 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-100">
        {children}
      </body>
    </html>
  );
}
