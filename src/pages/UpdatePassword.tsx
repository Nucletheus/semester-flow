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

type ResetState = "checking" | "ready" | "invalid_or_expired" | "wrong_domain";

export default function UpdatePassword() {
    const showDebugPanel = import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === "true";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<ResetState>("checking");
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [resendEmail, setResendEmail] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [expectedOrigin, setExpectedOrigin] = useState<string | null>(null);
    const [debugHasRecoveryParams, setDebugHasRecoveryParams] = useState(false);
    const [debugHasAuthCode, setDebugHasAuthCode] = useState(false);
    const [debugHasTokenPair, setDebugHasTokenPair] = useState(false);
    const [lastAuthErrorCode, setLastAuthErrorCode] = useState<string | null>(null);
    const [lastAuthErrorMessage, setLastAuthErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const showInvalidOrExpired = () => {
        setState("invalid_or_expired");
        setFormError("This reset link is invalid or has expired. Request a new one.");
    };

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
        const redirectTo = searchParams.get("redirect_to");
        const hasRecoveryParams =
            hashParams.get("type") === "recovery" ||
            searchParams.get("type") === "recovery" ||
            !!authCode ||
            (!!accessToken && !!refreshToken);
        setDebugHasRecoveryParams(hasRecoveryParams);
        setDebugHasAuthCode(Boolean(authCode));
        setDebugHasTokenPair(Boolean(accessToken && refreshToken));

        const validateRecoverySession = async () => {
            if (redirectTo) {
                try {
                    const redirectOrigin = new URL(redirectTo).origin;
                    if (redirectOrigin !== window.location.origin) {
                        setExpectedOrigin(redirectOrigin);
                        setState("wrong_domain");
                        setFormError(`This link was generated for ${redirectOrigin}.`);
                        return;
                    }
                } catch {
                    // Ignore malformed redirect_to values and continue regular validation.
                }
            }

            if (!hasRecoveryParams) {
                showInvalidOrExpired();
                return;
            }

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (error) {
                    if (!isMounted) return;
                    showInvalidOrExpired();
                    return;
                }
            } else if (authCode) {
                const { error } = await supabase.auth.exchangeCodeForSession(authCode);
                if (error) {
                    if (!isMounted) return;
                    showInvalidOrExpired();
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (!session?.user) {
                showInvalidOrExpired();
                return;
            }

            setState("ready");
            setFormError(null);
        };

        validateRecoverySession();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setCooldownSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldownSeconds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        const validation = strongPasswordSchema.safeParse(password);
        if (!validation.success) {
            setLastAuthErrorCode("password_validation");
            setLastAuthErrorMessage(validation.error.errors[0].message);
            setFormError(validation.error.errors[0].message);
            toast({
                title: "Error",
                description: validation.error.errors[0].message,
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            setLastAuthErrorCode("password_mismatch");
            setLastAuthErrorMessage("Passwords do not match.");
            setFormError("Passwords do not match.");
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setLastAuthErrorCode(null);
        setLastAuthErrorMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            setFormSuccess("Password updated successfully.");
            toast({
                title: "Password updated",
                description: "Your password has been successfully updated.",
            });
            const { data: { session } } = await supabase.auth.getSession();
            navigate(session?.user ? "/" : "/auth", { replace: true });
        } catch (error: unknown) {
            const errorCode = typeof (error as { code?: unknown })?.code === "string"
                ? (error as { code?: string }).code
                : null;
            const rawMessage = typeof (error as { message?: unknown })?.message === "string"
                ? (error as { message?: string }).message
                : null;
            const message = getAuthErrorMessage(error);
            setLastAuthErrorCode(errorCode);
            setLastAuthErrorMessage(rawMessage ?? message);
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

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        const normalizedEmail = resendEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setFormError("Enter your email to resend the reset link.");
            return;
        }

        setResendLoading(true);
        setLastAuthErrorCode(null);
        setLastAuthErrorMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;
            setCooldownSeconds(60);
            setFormSuccess(`Reset email sent to ${normalizedEmail} if an account exists.`);
            toast({
                title: "Reset email sent",
                description: "Use the newest email link to continue.",
            });
        } catch (error: unknown) {
            const errorCode = typeof (error as { code?: unknown })?.code === "string"
                ? (error as { code?: string }).code
                : null;
            const rawMessage = typeof (error as { message?: unknown })?.message === "string"
                ? (error as { message?: string }).message
                : null;
            const message = getAuthErrorMessage(error);
            setLastAuthErrorCode(errorCode);
            setLastAuthErrorMessage(rawMessage ?? message);
            setFormError(message);
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setResendLoading(false);
        }
    };

    if (state === "checking") {
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

                    {state === "ready" ? (
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
                    ) : (
                        <form onSubmit={handleResend} className="space-y-4">
                            {state === "wrong_domain" && expectedOrigin && (
                                <p className="text-sm text-muted-foreground">
                                    Link opened on wrong domain. Open this link on <span className="font-medium">{expectedOrigin}</span> or request a new reset email below.
                                </p>
                            )}
                            {state === "invalid_or_expired" && (
                                <p className="text-sm text-muted-foreground">
                                    Your previous reset link cannot be used anymore. Request a fresh link below.
                                </p>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="resendEmail">Email</Label>
                                <Input
                                    id="resendEmail"
                                    type="email"
                                    placeholder="you@university.edu"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={resendLoading || cooldownSeconds > 0}>
                                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend reset link"}
                            </Button>
                            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                                Back to sign in
                            </Button>
                        </form>
                    )}
                    {showDebugPanel && (
                        <div className="mt-4 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-left text-xs text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">Reset Debug</p>
                            <p>origin: {window.location.origin}</p>
                            <p>path: {window.location.pathname}</p>
                            <p>state: {state}</p>
                            <p>hasRecoveryParams: {String(debugHasRecoveryParams)}</p>
                            <p>hasAuthCode: {String(debugHasAuthCode)}</p>
                            <p>hasTokenPair: {String(debugHasTokenPair)}</p>
                            <p>expectedOrigin: {expectedOrigin ?? "-"}</p>
                            <p>cooldownSeconds: {cooldownSeconds}</p>
                            <p>lastErrorCode: {lastAuthErrorCode ?? "-"}</p>
                            <p>lastErrorMessage: {lastAuthErrorMessage ?? "-"}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
