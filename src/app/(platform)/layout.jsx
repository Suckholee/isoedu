import { Suspense } from 'react';
import PlatformWorkspace from '../../components/PlatformWorkspace';
export default function PlatformLayout({ children }) {
  return <Suspense fallback={<div role="status" className="p-8">화면을 불러오는 중입니다.</div>}><PlatformWorkspace />{children}</Suspense>;
}
