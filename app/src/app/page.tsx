import { ClientMountProvider } from '@/components/providers/ClientMountProvider';
import { HomePageClient } from './HomePageClient';

export default async function HomePage() {
  return (
    <ClientMountProvider>
      <HomePageClient />
    </ClientMountProvider>
  );
}
