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
import { getAuthErrorMessage } from "@/lib/authErrors";
import { PasswordRequirements } from "@/components/PasswordRequirements";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (!session?.user) {
                toast({
                    title: "Authentication required",
                    description: "Please sign in or verify your email code to update your password.",
                    variant: "destructive",
                });
                navigate("/auth", { replace: true });
                return;
            }

            setCheckingSession(false);
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        const validation = strongPasswordSchema.safeParse(password);
        if (!validation.success) {
            setFormError(validation.error.errors[0].message);
            toast({
                title: "Error",
                description: validation.error.errors[0].message,
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            setFormError("Passwords do not match.");
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

            setFormSuccess("Password updated successfully.");
            toast({
                title: "Password updated",
                description: "Your password has been successfully updated.",
            });
            navigate("/", { replace: true });
        } catch (error: unknown) {
            const message = getAuthErrorMessage(error);
            setFormError(message);
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
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
                    {formError && (
                        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                            {formSuccess}
                        </div>
                    )}

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
                        <PasswordRequirements password={password} confirmPassword={confirmPassword} />
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
