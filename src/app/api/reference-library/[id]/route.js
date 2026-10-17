import {GET as readDriveFile} from '../../client-drive/[id]/route.js';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(request,context){return readDriveFile(request,context);}
