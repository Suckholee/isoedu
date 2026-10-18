import { supabase } from './supabaseClient.js';
import { isCloudMode } from './dataConfig.js';
import { saveLocalFile, readLocalFile, listLocalFiles } from './localVault.js';

// 허용된 문서 규격 포맷 (ISO 감사 및 사내 표준 문서)
export const ALLOWED_MIME_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/x-hwp': 'HWP',
  'application/haansofthwp': 'HWP',
  'application/vnd.hancom.hwp': 'HWP',
  'application/hwp+zip': 'HWPX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG'
};

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MiB private bucket limit
export const STORAGE_BUCKET_NAME = 'iso-vault';

/**
 * 파일 업로드 전 유효성 검사
 */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: '업로드할 파일이 선택되지 않았습니다.' };
  }

  // 1. 크기 검사
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `파일 크기는 최대 100MB까지 지원됩니다. (현재: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` 
    };
  }

  // 2. 확장자 및 MIME 타입 검사
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'hwp', 'hwpx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];

  if (!allowedExts.includes(fileExt)) {
    return { 
      valid: false, 
      error: `지원하지 않는 파일 형식입니다. (지원: PDF, Word, Excel, HWP/HWPX, PowerPoint, PNG, JPG)` 
    };
  }

  return { valid: true, ext: fileExt };
}

/**
 * 안전한 파일명 생성 (특수문자 및 상위 디렉터리 경로 정제)
 */
export function sanitizeFileName(fileName) {
  const clean = (fileName || 'document').replace(/\\/g, '/');
  const baseRaw = clean.split('/').pop() || 'document';
  const ext = (baseRaw.split('.').pop() || '').toLowerCase();
  const rawBase = baseRaw.substring(0, baseRaw.lastIndexOf('.')) || baseRaw;
  const safeBase = rawBase.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3-]/g, '_').substring(0, 50);
  return `${safeBase || 'doc'}_${Date.now()}.${ext}`;
}

const fromVersion = row => ({
  id: row.id, docId: row.document_id, fileName: row.file_name, filePath: row.file_path,
  fileSize: row.file_size, checksum: row.checksum, uploadedAt: row.created_at,
  uploadedBy: row.author_name, version: row.rev_no, reason: row.change_reason,
});

export async function listDocumentFiles(companyId, docId) {
  if (!companyId || !docId) return [];
  if (!isCloudMode) return listLocalFiles(companyId, docId);
  if (!supabase) throw new Error('Supabase 연결 설정을 확인해 주세요.');
  const { data, error } = await supabase.from('document_versions').select('*')
    .eq('document_id', docId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromVersion);
}

export async function uploadDocumentFile(file, { companyId, docId, version = 1, user } = {}) {
  const validation = validateUploadFile(file);
  if (!validation.valid) throw new Error(validation.error);
  if (!companyId || !docId) throw new Error('회사의 문서를 먼저 저장해 주세요.');
  const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const id = crypto.randomUUID();
  const filePath = `companies/${companyId}/${docId}/${id}_${sanitizeFileName(file.name)}`;
  const metadata = {
    id, companyId, docId, filePath, fileName: file.name, fileSize: file.size, checksum, version,
    uploadedAt: new Date().toISOString(), uploadedBy: user?.fullName || user?.email || '로컬 사용자',
    reason: `${file.name} 등록`,
  };
  if (!isCloudMode) {
    await saveLocalFile({ ...metadata, filePath: `local/${id}`, blob: file });
    return { ...metadata, filePath: `local/${id}`, success: true, mode: 'local' };
  }
  if (!supabase || !user?.id) throw new Error('로그인 후 파일을 업로드해 주세요.');
  const { error } = await supabase.storage.from(STORAGE_BUCKET_NAME).upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data, error: recordError } = await supabase.from('document_versions').insert({
    id, document_id: docId, rev_no: version, change_reason: metadata.reason,
    author_id: user.id, author_name: metadata.uploadedBy, file_path: filePath,
    file_name: file.name, file_size: file.size, checksum,
  }).select().single();
  if (recordError) {
    const { error: cleanupError } = await supabase.storage.from(STORAGE_BUCKET_NAME).remove([filePath]);
    if (cleanupError) throw new Error(`파일 이력 저장 및 업로드 정리에 실패했습니다: ${recordError.message}`);
    throw recordError;
  }
  return { ...fromVersion(data), success: true, mode: 'cloud' };
}

export async function getSecureDownloadUrl(filePath, expiresInSeconds = 3600) {
  if (!filePath) throw new Error('파일 경로가 없습니다.');
  if (!isCloudMode && filePath.startsWith('local/')) {
    const record = await readLocalFile(filePath.slice(6));
    if (!record?.blob) throw new Error('이 브라우저에서 파일을 찾을 수 없습니다.');
    return URL.createObjectURL(record.blob);
  }
  if (!supabase || !isCloudMode || filePath.startsWith('local/')) throw new Error('현재 저장 모드의 파일이 아닙니다.');
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET_NAME).createSignedUrl(filePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
