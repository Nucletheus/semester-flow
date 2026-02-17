import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";
import { z } from "zod";

const strongPasswordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/auth");
            }
        });
    }, [navigate]);

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

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast({
                title: "Password updated",
                description: "Your password has been successfully updated.",
            });
            navigate("/");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

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
