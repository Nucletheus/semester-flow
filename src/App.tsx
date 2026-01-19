import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Deadlines from "./pages/Deadlines";
import NotFound from "./pages/NotFound";
import UpdatePassword from "./pages/UpdatePassword";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import { Header } from "./components/Header";

const queryClient = new QueryClient();

const MainLayout = () => {
  return (
    <Layout>
      <Header />
      <Outlet />
    </Layout>
  )
}

const App = () => (
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
