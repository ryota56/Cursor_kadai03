import { ClientMountProvider } from '@/components/providers/ClientMountProvider';
import { MePageClient } from './MePageClient';

// Server Component - 枠のみ描画、中身はClientOnlyで後置換
export default function MePage() {
  return (
    <ClientMountProvider>
      <MePageClient />
    </ClientMountProvider>
  );
}
