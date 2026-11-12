import {Suspense} from 'react';
import GrowthLanding from '../components/GrowthLanding';
export const metadata = {
  title: '써티멘토 | 국내외 기업인증·제품인증 준비',
  description: '국내외 기업인증과 제품인증에 필요한 요건, 시험·심사 자료, 신청 서류를 확인하고 준비하세요.',
};

export default function HomePage(){return <Suspense><GrowthLanding/></Suspense>;}
