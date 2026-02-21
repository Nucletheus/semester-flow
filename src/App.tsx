import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Deadlines from "./pages/Deadlines";
import GettingStarted from "./pages/GettingStarted";
import NotFound from "./pages/NotFound";
import UpdatePassword from "./pages/UpdatePassword";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import { Header } from "./components/Header";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MainLayout = () => {
  return (
    <Layout>
      <Header />
      <Outlet />
    </Layout>
  )
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="tropical" defaultDark={false}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/deadlines" element={<Deadlines />} />
                <Route path="/getting-started" element={<GettingStarted />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
