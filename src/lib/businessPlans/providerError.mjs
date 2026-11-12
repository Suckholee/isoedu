import {PlanError} from './model.mjs';
export async function providerError(response,kind='AI'){
 let code,type;try{const value=await response.json();code=value.error?.code;type=value.error?.type;}catch{}
 if(['credit_balance_exhausted','insufficient_quota'].includes(code)||type==='insufficient_quota')return new PlanError('AI 연결 계정의 사용 잔액이 부족합니다. 잔액을 충전한 뒤 같은 입력으로 이어서 작성할 수 있습니다.',503);
 if(response.status===429)return new PlanError(`${kind} 요청이 많습니다. 잠시 후 같은 입력으로 다시 시도해 주세요.`,429);
 if([401,403].includes(response.status))return new PlanError(`${kind} 연결 계정의 인증·이용 권한을 확인해 주세요.`,503);
 return new PlanError(`${kind} 생성 요청에 실패했습니다. 입력과 완성된 내용은 보존됩니다.`,502);
}
