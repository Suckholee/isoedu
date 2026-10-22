import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {dataConfig} from '../../../lib/dataConfig';
import {createVaultFileHandler} from '../../../lib/vaultFileHandler.mjs';
export const dynamic='force-dynamic';
export const GET=createVaultFileHandler({getClient:()=>createClient(cookies()),config:dataConfig});
