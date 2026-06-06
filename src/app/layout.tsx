import { Providers } from '@/app/providers'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-dark text-brand-text antialiased overflow-hidden">
        <Providers>
          <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-y-auto pb-20 md:pb-0 overscroll-y-contain">
                {children}
              </div>
              <BottomNav />
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
