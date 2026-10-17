import {clientDrive} from '../src/lib/clientDrive.mjs';
import {registerDocumentPreview} from '../src/lib/documentPreview.mjs';
const [id,pdf]=process.argv.slice(2);if(!id||!pdf)throw Error('사용법: node scripts/register-document-preview.mjs 파일ID 한컴에서저장한.pdf');
await registerDocumentPreview(await clientDrive.file(id),pdf);console.log('원문 미리보기 등록 완료:',id);
