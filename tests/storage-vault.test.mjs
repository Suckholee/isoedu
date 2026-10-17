import test from 'node:test';
import 'fake-indexeddb/auto';
import { readLocalFile } from '../src/lib/localVault.js';
import assert from 'node:assert/strict';
import { 
  validateUploadFile, 
  sanitizeFileName, 
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  uploadDocumentFile,
  listDocumentFiles,
  getSecureDownloadUrl
} from '../src/lib/storageVault.js';

test('storage vault: rejects missing file', () => {
  const result = validateUploadFile(null);
  assert.equal(result.valid, false);
  assert.match(result.error, /선택되지 않았습니다/);
});

test('storage vault: rejects oversized files exceeding 50MB', () => {
  const fakeFile = {
    name: 'heavy_audit_scan.pdf',
    size: 55 * 1024 * 1024 // 55MB
  };
  const result = validateUploadFile(fakeFile);
  assert.equal(result.valid, false);
  assert.match(result.error, /50MB/);
});

test('storage vault: rejects unsupported extensions (.exe, .sh, .bat)', () => {
  for (const badName of ['malware.exe', 'script.sh', 'hack.bat', 'data.bin']) {
    const fakeFile = { name: badName, size: 1024 };
    const result = validateUploadFile(fakeFile);
    assert.equal(result.valid, false);
    assert.match(result.error, /지원하지 않는 파일 형식/);
  }
});

test('storage vault: accepts valid ISO document formats (.pdf, .docx, .xlsx, .hwp, .png)', () => {
  const validFiles = [
    { name: '품질경영매뉴얼.pdf', size: 2 * 1024 * 1024 },
    { name: '내부심사절차서.docx', size: 500 * 1024 },
    { name: '위험성평가표.xlsx', size: 300 * 1024 },
    { name: '작업표준지침서.hwp', size: 1 * 1024 * 1024 },
    { name: '인증서스캔.png', size: 4 * 1024 * 1024 }
  ];

  for (const f of validFiles) {
    const result = validateUploadFile(f);
    assert.equal(result.valid, true);
    assert.ok(result.ext);
  }
});

test('storage vault: sanitizes malicious file names', () => {
  const dangerousName = '../../../etc/passwd.pdf';
  const safe = sanitizeFileName(dangerousName);
  assert.ok(!safe.includes('/'));
  assert.ok(!safe.includes('..'));
  assert.ok(safe.endsWith('.pdf'));
});

test('storage vault: local files persist with a real hash and are isolated by document', async () => {
  const file = new File(['hello'], 'report.pdf', { type: 'application/pdf' });
  const saved = await uploadDocumentFile(file, {
    companyId: 'company-a', docId: 'doc-a', user: { email: 'member@example.com' },
  });
  assert.equal(saved.success, true);
  assert.equal(saved.checksum, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  const files = await listDocumentFiles('company-a', 'doc-a');
  assert.equal(files.length, 1);
  assert.equal(files[0].id, saved.id);
  assert.deepEqual(await listDocumentFiles('company-b', 'doc-a'), []);
  assert.deepEqual(await listDocumentFiles('company-a', 'doc-b'), []);
  assert.equal(await (await readLocalFile(saved.id)).blob.text(), 'hello');
  const download = await getSecureDownloadUrl(saved.filePath);
  assert.equal(await (await fetch(download)).text(), 'hello');
  URL.revokeObjectURL(download);
});

test('storage vault: unavailable persistent storage fails instead of reporting success', async () => {
  const database = globalThis.indexedDB;
  delete globalThis.indexedDB;
  try {
    await assert.rejects(uploadDocumentFile(new File(['data'], 'report.pdf'), { companyId: 'a', docId: 'b' }), /IndexedDB/);
  } finally { globalThis.indexedDB = database; }
});

test('storage vault: cloud permission failures never become local success', async () => {
  const { execFileSync } = await import('node:child_process');
  const script = `
    import assert from 'node:assert/strict';
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'permission denied', statusCode: 403 }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    const { uploadDocumentFile } = await import('./src/lib/storageVault.js');
    await assert.rejects(uploadDocumentFile(new File(['data'], 'test.pdf'), {
      companyId: 'company-a', docId: 'document-a', user: { id: 'test-user' },
    }), /permission denied/);
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, NEXT_PUBLIC_DATA_MODE: 'cloud', NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key' },
    stdio: 'pipe',
  });
});
