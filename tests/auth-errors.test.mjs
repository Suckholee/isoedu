import test from 'node:test';
import assert from 'node:assert/strict';
import { profileErrorMessage } from '../src/lib/authErrors.mjs';
test('schema, missing profile and network failures have distinct recovery messages', () => {
  assert.match(profileErrorMessage({code:'PGRST205'}), /サーバー設定|서버 설정/);
  assert.match(profileErrorMessage({code:'PGRST116'}), /프로필이 등록되지/);
  assert.match(profileErrorMessage(new Error('connection failed')), /다시 불러와/);
});
