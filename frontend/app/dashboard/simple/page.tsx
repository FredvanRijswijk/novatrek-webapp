import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, MessageCircle, MapPin } from "lucide-react"

export default function SimpleDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Simple Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome to NovaTrek!</h1>
              <p className="text-muted-foreground mt-1">
                Your AI-powered travel planning assistant
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Plan New Trip</h3>
                  <p className="text-sm text-muted-foreground">Start planning your next adventure</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">AI Travel Assistant</h3>
                  <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">View Itineraries</h3>
                  <p className="text-sm text-muted-foreground">Manage your trip schedules</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to start traveling?</h3>
            <p className="text-muted-foreground mb-4">Create your first trip to get started!</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}