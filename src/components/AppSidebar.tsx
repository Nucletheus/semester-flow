
import {
    BookOpen,
    Calendar,
    LayoutDashboard,
    LogOut,
    Settings,
    Trash2,
    Moon,
    Sun,
    ListTodo,
    Palette,
    Check,
    LockKeyhole,
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { SemesterSettings } from "@/components/SemesterSettings"
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme, Theme } from "@/components/ThemeProvider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AppSidebar() {
    const { user, signOut } = useAuth()
    const location = useLocation()
    const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme()
    const [showSemesterSettings, setShowSemesterSettings] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    const initials = user?.email?.slice(0, 2).toUpperCase() || "U"

    const handleDeleteAccount = async () => {
        try {
            if (!user?.id) return;
            // @ts-ignore
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;
            await signOut();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const menuItems = [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "Deadlines",
            url: "/deadlines",
            icon: ListTodo,
        },
    ]

    const themes: { value: Theme; label: string; color: string }[] = [
        { value: "tropical", label: "Tropical", color: "bg-purple-600" },
        { value: "ocean", label: "Ocean", color: "bg-cyan-600" },
        { value: "forest", label: "Forest", color: "bg-emerald-600" },
        { value: "sunset", label: "Sunset", color: "bg-orange-500" },
        { value: "nebula", label: "Nebula", color: "bg-violet-600" },
    ];

    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">Workload Tracker</span>
                            <span className="truncate text-xs text-muted-foreground">Capacity Planner</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarSeparator />
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname === item.url}
                                            tooltip={item.title}
                                        >
                                            <Link to={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Settings</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton tooltip="Theme">
                                                <Palette />
                                                <span>Theme</span>
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="start" side="right">
                                            <div className="px-2 py-1.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                                    <Label htmlFor="sidebar-dark-mode" className="text-sm font-medium">Dark Mode</Label>
                                                </div>
                                                <Switch
                                                    id="sidebar-dark-mode"
                                                    checked={isDarkMode}
                                                    onCheckedChange={toggleDarkMode}
                                                />
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
                                            {themes.map((t) => (
                                                <DropdownMenuItem
                                                    key={t.value}
                                                    onClick={() => setTheme(t.value)}
                                                    className="justify-between cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${t.color}`} />
                                                        {t.label}
                                                    </div>
                                                    {theme === t.value && <Check className="h-4 w-4" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={() => setShowSemesterSettings(true)}>
                                        <Settings />
                                        <span>Timeline Settings</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">My Account</span>
                                            <span className="truncate text-xs">{user?.email}</span>
                                        </div>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                                        <LockKeyhole className="mr-2 h-4 w-4" />
                                        Change Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={signOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SemesterSettings
                open={showSemesterSettings}
                onOpenChange={setShowSemesterSettings}
            />

            <ChangePasswordDialog
                open={showChangePassword}
                onOpenChange={setShowChangePassword}
            />

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
