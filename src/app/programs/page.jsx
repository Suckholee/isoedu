import {Suspense} from 'react';
import PublicPrograms from '../../components/PublicPrograms';
export const metadata={title:'정부지원사업 캘린더 | 어니스톤',description:'로그인 없이 정부지원사업 일정과 공고를 확인하고 회사별 준비 업무로 이어가세요.'};
export default function PublicProgramsPage(){return <Suspense><PublicPrograms/></Suspense>;}
