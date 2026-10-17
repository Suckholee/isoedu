import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: '어니스톤 | 기업 문서·사업계획서 관리',
  description: '회사별 구비문서와 사업계획서 작성을 연결하는 어니스톤 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
