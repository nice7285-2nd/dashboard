import { auth } from '@/auth';
import EditStudyBoardClient from './EditStudyBoardClient';

export default async function EditStudyBoardPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const author = session?.user?.name || null;
  const email = session?.user?.email || null;

  return <EditStudyBoardClient params={params} author={author} email={email} />;
}

