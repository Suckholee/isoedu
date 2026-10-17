import { notFound } from 'next/navigation';
import { validPlatformPath } from '../../../../lib/platformRoutes.mjs';
export default function FeaturePage({ params }) {
  if (!validPlatformPath(params.section, params.detail)) notFound();
  return null;
}
