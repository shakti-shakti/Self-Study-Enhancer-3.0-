
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  LayoutDashboard, Edit3, Target as TargetIcon, Trophy, Users, 
  BookOpen as BookOpenIcon, Brain, BarChart3, Lightbulb, FileText as FileTextIcon, 
  Bot, SlidersHorizontal, UserCircle, Settings, History, BookHeadphones, RadioTower,
  Calculator, Languages, SpellCheck, Info, Music, Globe, UploadCloud, Star, FolderOpen, AlarmClock,
  Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  SidebarProvider, Sidebar, SidebarTrigger, SidebarRail, SidebarInset, 
  SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Ensure cn is imported

export const metadata: Metadata = {
  title: 'Dashboard - NEET Prep+',
  description: 'Your NEET Prep+ Dashboard',
};

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
  { name: 'Planner', href: '/dashboard/planner', icon: <Edit3 /> },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: <TargetIcon /> },
  { name: 'Challenges', href: '/dashboard/challenges', icon: <Trophy /> },
  { name: 'AI Assistant', href: '/dashboard/ai-study-assistant', icon: <Bot /> },
  { name: 'Games', href: '/dashboard/games', icon: <Gamepad2 /> },
];

const toolsNavItems = [
  { name: 'NCERT Explorer', href: '/dashboard/ncert-explorer', icon: <BookOpenIcon /> },
  { name: 'Smart Notes', href: '/dashboard/smart-notes-generator', icon: <FileTextIcon /> },
  { name: 'Doubt Resolver', href: '/dashboard/smart-doubt-resolver', icon: <Lightbulb /> },
  { name: 'Dictionary', href: '/dashboard/dictionary', icon: <SpellCheck /> },
  { name: 'Translator', href: '/dashboard/translator', icon: <Languages /> },
  { name: 'Calculator', href: '/dashboard/calculator', icon: <Calculator /> },
];

const resourcesNavItems = [
  { name: 'Guidelines', href: '/dashboard/guidelines', icon: <Info /> },
  { name: 'Music Player', href: '/dashboard/music', icon: <Music /> },
  { name: 'Web Browser', href: '/dashboard/browser', icon: <Globe /> },
  { name: 'File Uploads', href: '/dashboard/file-uploads', icon: <UploadCloud /> },
  { name: 'Saved Questions', href: '/dashboard/saved-questions', icon: <Star /> },
  { name: 'Custom Tasks', href: '/dashboard/custom-tasks', icon: <FolderOpen /> },
  { name: 'Task Reminders', href: '/dashboard/task-reminders', icon: <AlarmClock /> },
  { name: 'NCERT Viewer', href: '/dashboard/ncert-viewer', icon: <BookOpenIcon /> },
];

const accountNavItems = [
  { name: 'Progress Tracker', href: '/dashboard/progress', icon: <BarChart3 /> },
  { name: 'Activity History', href: '/dashboard/activity-history', icon: <History /> },
  { name: 'Mind & Focus Hub', href: '/dashboard/mental-health', icon: <Brain /> },
  { name: 'Study Rooms', href: '/dashboard/study-rooms', icon: <Users /> },
  { name: 'App Customization', href: '/dashboard/app-customization', icon: <SlidersHorizontal /> },
  { name: 'Profile Settings', href: '/dashboard/profile', icon: <Settings /> },
];

// Helper for SidebarMenuButton to avoid repetition
const SidebarGroupLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("duration-200 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden", className)} {...props} />
);


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware should handle this if auth is enabled
  // if (!user) {
  //   redirect('/login');
  // }

  const profile = user ? (await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()).data : null;

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userAvatarUrl = profile?.avatar_url;
  const userEmail = profile?.email || user?.email;

  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Planner', href: '/dashboard/planner', icon: Edit3 },
    { name: 'AI Assistant', href: '/dashboard/ai-study-assistant', icon: Bot },
    { name: 'Games', href: '/dashboard/games', icon: Gamepad2 },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
  ];


  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <SidebarRail />
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-primary hover:text-primary/90 transition-colors">
            <BookHeadphones className="h-8 w-8 shrink-0" />
            <span className="text-2xl font-headline font-bold glow-text-primary group-data-[collapsible=icon]:hidden">NEET Prep+</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={{children: item.name, side: "right", align: "center"}}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator className="my-3"/>
          <SidebarMenu>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            {toolsNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={{children: item.name, side: "right", align: "center"}}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator className="my-3"/>
           <SidebarMenu>
            <SidebarGroupLabel>Resources</SidebarGroupLabel>
            {resourcesNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={{children: item.name, side: "right", align: "center"}}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator className="my-3"/>
          <SidebarMenu>
             <SidebarGroupLabel>Account</SidebarGroupLabel>
            {accountNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={{children: item.name, side: "right", align: "center"}}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
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
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          {user && (
            <>
            <div className="flex items-center gap-3 mb-2 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-9 w-9">
                  <AvatarImage src={userAvatarUrl || undefined} alt={userDisplayName} data-ai-hint="user avatar"/>
                  <AvatarFallback>{userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{userDisplayName}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">{userEmail}</p>
              </div>
            </div>
            <form action={logout} className="w-full">
              <Button variant="outline" size="sm" className="w-full font-medium border-destructive/50 text-destructive/90 hover:bg-destructive/20 hover:text-destructive glow-button group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0">
                <RadioTower className="mr-2 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </Button>
            </form>
            </>
          )}
          {!user && (
             <Button variant="outline" size="sm" className="w-full font-medium" asChild>
                <Link href="/login">
                    <RadioTower className="mr-2 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Login</span>
                </Link>
             </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 w-full border-b border-border/30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
              <BookHeadphones className="h-7 w-7" />
              <span className="text-2xl font-headline font-bold glow-text-primary">NEET Prep+</span>
            </Link>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
            </div>
          </div>
        </header>
        <header className="sticky top-0 z-30 w-full border-b border-border/30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
          <div className="container flex h-16 items-center justify-start">
             <SidebarTrigger />
          </div>
        </header>
        <main className="flex-1 container py-6 md:py-8 relative">
            {children}
        </main>
        
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border shadow-t-lg z-40">
          <div className="flex justify-around items-center h-16">
            {bottomNavItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center text-sidebar-foreground/70 hover:text-primary transition-colors p-2 flex-1">
                  <Icon className="h-6 w-6 mb-0.5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="h-16 md:hidden"></div> {/* Spacer for bottom nav */}


        <footer className="py-4 md:py-6 text-center text-muted-foreground text-sm border-t border-border/30">
          NEET Prep+ &copy; {new Date().getFullYear()} - Maximize Your Potential.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
