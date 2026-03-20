import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const headersList = await headers()

    // Login page bypasses auth layout
    // We detect this using a simpler approach - try auth and if on login page, skip
    let session = null
    try {
        session = await auth()
    } catch {
        // Auth not configured yet
    }

    // If accessing login page, render without sidebar/header
    // The middleware handles the actual redirect logic
    if (!session) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-dark-bg overflow-hidden">
            {/* Sidebar — hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
                <AdminSidebar userName={session.user?.name || 'Admin'} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader
                    userName={session.user?.name || 'Admin'}
                    userEmail={session.user?.email || 'admin@Roxylay.com'}
                />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    )
}
