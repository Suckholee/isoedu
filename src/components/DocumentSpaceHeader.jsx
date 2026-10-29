'use client';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Folders, BookOpen} from 'lucide-react';

export default function DocumentSpaceHeader({active,enterprise=false}) {
  const params=useSearchParams();const company=params.get('company');const suffix=company?'?company='+encodeURIComponent(company):'';
  if(enterprise)return <header className="document-space-header document-space-header-compact"><h1>회사 문서함</h1></header>;
  return <header className={"document-space-header"+(params.get('dateReview')==='1'?' document-space-header-compact':'')}>
    <h1>문서 관리</h1>
    <p>거래처별 문서를 보관하고, ISO 규격별 구비문서와 작성 기준을 확인하세요.</p>
    <nav aria-label="문서 공간">
      <Link href={'/documents'+suffix} aria-current={active==='clients'?'page':undefined}><Folders size={17}/>거래처 드라이브</Link>
      <Link href={'/documents/iso'+suffix} aria-current={active==='iso'?'page':undefined}><BookOpen size={17}/>ISO 규격 문서</Link>
    </nav>
  </header>;
}
