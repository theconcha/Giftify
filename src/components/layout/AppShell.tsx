import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell() {
  return (
    <div className="min-h-svh bg-[#FAF6F1]">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-svh">
        <Header />
        <main className="flex-1 w-full max-w-[1800px] mx-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
