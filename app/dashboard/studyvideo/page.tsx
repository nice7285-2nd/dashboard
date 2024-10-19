import { auth } from "@/auth";
import VideoList from "./VideoList";  // VideoList 컴포넌트를 별도 파일로 분리

export default async function StudyVideoPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const email = session?.user?.email;

  return <VideoList userRole={userRole} email={email || ''} />;
}