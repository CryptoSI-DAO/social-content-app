import { Providers } from '@/app/providers'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-dark text-brand-text antialiased">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar - hidden on mobile, shown on md+ */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {children}
              </div>

              {/* Bottom nav - shown on mobile, hidden on md+ */}
              <BottomNav />
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
