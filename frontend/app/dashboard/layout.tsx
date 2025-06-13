import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { WaitlistGate } from "@/components/auth/WaitlistGate";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireSubscription={false}>
      <WaitlistGate adminBypass={true}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-sidebar-border" />
            </header>
            <div className="flex-1 p-4 md:p-6">{children}</div>
            <FeedbackWidget />
          </SidebarInset>
        </SidebarProvider>
      </WaitlistGate>
    </ProtectedRoute>
  );
}
