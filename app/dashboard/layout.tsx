import SideNav from '@/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen md:flex-row md:overflow-hidden">
      <div className="flex-none w-auto">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto bg-slate-100">
        {children}
      </div>
    </div>
  );
}
