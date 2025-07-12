import SuperAgent from './components/SuperAgent';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('googlesheet_user_id')?.value;

  return (
    <div className="flex flex-col h-screen bg-white">
      <main className="flex-1 overflow-y-auto">
        <SuperAgent userId={userId ?? null} />
      </main>
    </div>
  );
}
