'use client';
import ModalLayer from './ui/ModalLayer';
import SocialLoginButtons from './SocialLoginButtons';

import {readLoginFields} from '../lib/authForm.mjs';
import Button from './ui/Button';
import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  User, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, switchDemoRole, isDemoMode } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('MEMBER'); // 'MEMBER' | 'AUDITOR' | 'ADMIN'
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fields=readLoginFields(new FormData(e.currentTarget),{email,password});
    if (!fields.email || !fields.password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)){setErrorMessage('이메일 주소를 확인해 주세요.');return;}
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(fields.email, fields.password);
        if (res.success) {
          setSuccessMessage('성공적으로 로그인되었습니다.');
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setErrorMessage(res.error || '로그인에 실패했습니다. 계정 정보를 확인해 주세요.');
        }
      } else {
        if (!fullName) {
          setErrorMessage('성명을 입력해 주세요.');
          setIsSubmitting(false);
          return;
        }
        const res = await signup({ email:fields.email, password:fields.password, fullName, role, companyName });
        if (res.success) {
          setSuccessMessage(res.needsConfirmation ? '이메일의 인증 링크를 확인한 뒤 로그인해 주세요.' : '회원가입이 완료되었습니다. 승인 없이 회사 공간을 바로 사용할 수 있습니다.');
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setErrorMessage(res.error || '회원가입 중 오류가 발생했습니다.');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoRole) => {
    switchDemoRole(demoRole);
    setSuccessMessage(`${demoRole === 'ADMIN' ? '최고관리자' : demoRole === 'AUDITOR' ? '공인심사원' : '기업실무자'} 모드로 전환되었습니다.`);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <ModalLayer onClose={onClose} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white text-slate-900 w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {mode === 'login' ? '어니스톤 회원 로그인' : '어니스톤 기업회원 가입'}
              </h2>
              <p className="text-xs text-blue-100">
                인증 문서 보안 스토리지 및 감사 플랫폼
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-center rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-center rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            신규 회원가입
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isDemoMode && <><SocialLoginButtons /><div className="text-center text-xs text-slate-400">또는 이메일로 계속하기</div></>}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">성명 / 담당자명</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">회사명</label><p className="text-xs text-slate-500 mb-2">가입 즉시 새 회사 공간을 사용할 수 있습니다. 같은 이름의 기존 회사 자료와는 자동 연결되지 않습니다.</p>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="(주)하이테크정밀"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {isDemoMode && <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">가입 역할 (권한 레벨)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('MEMBER')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'MEMBER'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏢 기업 실무자
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('AUDITOR')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'AUDITOR'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔍 공인 심사원
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'ADMIN'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛡️ 최고 관리자
                  </button>
                </div>
              </div>}
            </>
          )}

          <div>
            <label htmlFor="auth-email-input" className="block text-xs font-bold text-slate-700 mb-1">아이디 또는 업무용 이메일</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="auth-email-input"
                type="text"
                name="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
                aria-label="업무용 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student1 또는 name@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password-input" className="block text-xs font-bold text-slate-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                name="password" autoComplete={mode==='login'?'current-password':'new-password'}
                aria-label="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-2.5 top-2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>처리 중...</span>
            ) : (
              <>
                <span>{mode === 'login' ? '로그인하여 플랫폼 접속' : '회원가입 완료'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Quick Demo Switchers */}
          {isDemoMode && <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>원클릭 시연 및 역할 체험</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 text-center transition-colors"
              >
                👑 최고관리자
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('AUDITOR')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 text-center transition-colors"
              >
                🔍 KAB 심사원
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('MEMBER')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 text-center transition-colors"
              >
                🏢 기업 실무자
              </button>
            </div>
          </div>}
        </form>
      </div>
    </ModalLayer>
  );
}
