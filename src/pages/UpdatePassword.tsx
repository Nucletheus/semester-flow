import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";
import { strongPasswordSchema } from "@/lib/authValidation";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get("access_token") ?? searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") ?? searchParams.get("refresh_token");
        const authCode = searchParams.get("code");
        const hasRecoveryParams =
            hashParams.get("type") === "recovery" ||
            searchParams.get("type") === "recovery" ||
            !!authCode ||
            (!!accessToken && !!refreshToken);

        const validateRecoverySession = async () => {
            if (!hasRecoveryParams) {
                toast({
                    title: "Invalid reset link",
                    description: "This reset link is invalid or has expired. Request a new one.",
                    variant: "destructive",
                });
                navigate("/auth", { replace: true });
                return;
            }

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (error) {
                    if (!isMounted) return;
                    toast({
                        title: "Invalid reset link",
                        description: "This reset link is invalid or has expired. Request a new one.",
                        variant: "destructive",
                    });
                    navigate("/auth", { replace: true });
                    return;
                }
            } else if (authCode) {
                const { error } = await supabase.auth.exchangeCodeForSession(authCode);
                if (error) {
                    if (!isMounted) return;
                    toast({
                        title: "Invalid reset link",
                        description: "This reset link is invalid or has expired. Request a new one.",
                        variant: "destructive",
                    });
                    navigate("/auth", { replace: true });
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (!session?.user) {
                toast({
                    title: "Invalid reset link",
                    description: "This reset link is invalid or has expired. Request a new one.",
                    variant: "destructive",
                });
                navigate("/auth", { replace: true });
                return;
            }

            setReady(true);
        };

        validateRecoverySession();

        return () => {
            isMounted = false;
        };
    }, [navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = strongPasswordSchema.safeParse(password);
        if (!validation.success) {
            toast({
                title: "Error",
                description: validation.error.errors[0].message,
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast({
                title: "Password updated",
                description: "Your password has been successfully updated.",
            });
            const { data: { session } } = await supabase.auth.getSession();
            navigate(session?.user ? "/" : "/auth", { replace: true });
        } catch (error: any) {
            const message = error?.code === "otp_expired" || String(error?.message || "").toLowerCase().includes("expired")
                ? "This reset session has expired. Request a new reset link."
                : error.message;
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md animate-slide-up shadow-medium">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-semibold">
                            Update Password
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Enter your new password below
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
