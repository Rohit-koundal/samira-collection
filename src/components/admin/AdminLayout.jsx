import { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f2eb] lg:pl-[274px]">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 pb-20 lg:pb-0">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
