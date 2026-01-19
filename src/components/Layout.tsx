
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { WhatsNewDialog } from "./WhatsNewDialog"

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {children}
                <Toaster />
                <Sonner />
                <WhatsNewDialog />
            </SidebarInset>
        </SidebarProvider>
    )
}
