import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  BookOpenCheck, LogOut, LayoutDashboard, Edit3, Target as TargetIcon, Trophy, Users, 
  BookOpen as BookOpenIcon, Brain, BarChart3, Lightbulb, FileText as FileTextIcon, Bot, SlidersHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  SidebarProvider, Sidebar, SidebarTrigger, SidebarRail, SidebarInset, 
  SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from '@/components/ui/sidebar'; // Assuming sidebar components are structured like this

export const metadata: Metadata = {
  title: 'Dashboard - NEET Prep+',
  description: 'Your NEET Prep+ Dashboard',
};

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
  { name: 'Planner', href: '/dashboard/planner', icon: <Edit3 /> },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: <TargetIcon /> },
  { name: 'Challenges', href: '/dashboard/challenges', icon: <Trophy /> },
  { name: 'Study Rooms', href: '/dashboard/study-rooms', icon: <Users /> },
  { name: 'NCERT Explorer', href: '/dashboard/ncert-explorer', icon: <BookOpenIcon /> },
  { name: 'Mind & Focus Hub', href: '/dashboard/mental-health', icon: <Brain /> },
  { name: 'Progress Tracker', href: '/dashboard/progress', icon: <BarChart3 /> },
  { name: 'Doubt Resolver', href: '/dashboard/smart-doubt-resolver', icon: <Lightbulb /> },
  { name: 'Notes Generator', href: '/dashboard/smart-notes-generator', icon: <FileTextIcon /> },
  { name: 'AI Assistant', href: '/dashboard/ai-study-assistant', icon: <Bot /> },
  { name: 'Customize App', href: '/dashboard/app-customization', icon: <SlidersHorizontal /> },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <SidebarRail />
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <BookOpenCheck className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold glow-text-primary group-data-[collapsible=icon]:hidden">NEET Prep+</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={{children: item.name, side: "right", align: "center"}}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <div className="p-2 group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <form action={logout} className="w-full">
            <Button variant="outline" size="sm" className="w-full font-medium border-primary text-primary hover:bg-primary/10 hover:text-primary glow-button group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0">
              <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
              <BookOpenCheck className="h-7 w-7" />
              <span className="text-2xl font-headline font-bold glow-text-primary">NEET Prep+</span>
            </Link>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
            </div>
          </div>
        </header>
        <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
          <div className="container flex h-16 items-center justify-between">
             <SidebarTrigger />
             <div className="flex items-center gap-4">
               <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              {/* Logout button moved to sidebar footer for desktop, can be kept here for mobile if preferred */}
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8">{children}</main>
        <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/50">
          NEET Prep+ &copy; {new Date().getFullYear()} - Fueling Your Success.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
