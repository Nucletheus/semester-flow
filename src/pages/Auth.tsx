import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { strongPasswordSchema } from "@/lib/authValidation";
import { getAuthErrorMessage } from "@/lib/authErrors";

// Schema for Login
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = loginSchema.extend({ password: strongPasswordSchema });

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthView = "login" | "signup" | "forgot" | "verify";

export default function Auth() {
  const showDebugPanel = import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === "true";
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [lastAuthErrorCode, setLastAuthErrorCode] = useState<string | null>(null);
  const [lastAuthErrorMessage, setLastAuthErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const showValidationToast = (message: string) => {
    toast({
      title: "Check your input",
      description: message,
      variant: "destructive",
    });
  };

  const hasRecoveryParams = useMemo(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    return (
      hashParams.get("type") === "recovery" ||
      hashParams.has("access_token") ||
      hashParams.has("refresh_token") ||
      searchParams.get("type") === "recovery" ||
      searchParams.has("code")
    );
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (hasRecoveryParams) {
        navigate(`/update-password${window.location.search}${window.location.hash}`, { replace: true });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/", { replace: true });
      }
    };

    bootstrapAuth();
  }, [hasRecoveryParams, navigate]);

  const validateForm = () => {
    setErrors({});
    setFormError(null);
    setFormSuccess(null);

    if (view === "forgot") {
      const emailValidation = z.string().email().safeParse(email);
      if (!emailValidation.success) {
        const message = "Please enter a valid email address";
        setErrors({ email: message });
        showValidationToast(message);
        return false;
      }
      return true;
    }

    if (view === "verify") {
      if (otp.length !== 6) {
        const message = "Please enter the 6-digit verification code";
        setFormError(message);
        showValidationToast(message);
        return false;
      }
      return true;
    }

    // Use different schema based on view
    const schema = view === "signup" ? signupSchema : loginSchema;
    const validation = schema.safeParse({ email, password });

    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      const firstError = fieldErrors.email || fieldErrors.password || "Please review your details and try again.";
      showValidationToast(firstError);
      return false;
    }

    if (view === "signup" && password !== confirmPassword) {
      const message = "Passwords do not match";
      setErrors({ confirmPassword: message });
      showValidationToast(message);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const appOrigin = window.location.origin;

    try {
      setLastAuthErrorCode(null);
      setLastAuthErrorMessage(null);
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setFormError(null);
        setFormSuccess("Signed in successfully.");
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
      } else if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: appOrigin },
        });
        if (error) throw error;

        if (data.session) {
          setFormError(null);
          setFormSuccess("Account created. You're signed in.");
          toast({
            title: "Account created",
            description: "You're signed in and ready to go.",
          });
          navigate("/", { replace: true });
          return;
        }

        setFormError(null);
        setFormSuccess("Account created. Check your email for verification.");
        toast({
          title: "Account created!",
          description: "Check your email for verification. You can sign in as soon as your project auth settings allow it.",
        });
      } else if (view === "forgot") {
        const recoveryEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithOtp({
          email: recoveryEmail,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setFormError(null);
        setFormSuccess(`Reset code sent to ${recoveryEmail} if an account exists.`);
        toast({
          title: "Reset code sent",
          description: `Enter the code sent to ${recoveryEmail}.`,
        });
        setView("verify");
      } else if (view === "verify") {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: "email",
        });
        if (error) throw error;
        setFormError(null);
        setFormSuccess("Verified successfully. Redirecting to reset password...");
        toast({
          title: "Code verified",
          description: "Please set your new password.",
        });
        navigate("/update-password");
      }
    } catch (error: unknown) {
      const errorCode = typeof (error as { code?: unknown })?.code === "string"
        ? (error as { code?: string }).code
        : null;
      const rawMessage = typeof (error as { message?: unknown })?.message === "string"
        ? (error as { message?: string }).message
        : "";
      let message = getAuthErrorMessage(error);
      if (rawMessage.includes("User already registered")) {
        message = "This email is already registered. Try signing in instead.";
      }
      setLastAuthErrorCode(errorCode);
      setLastAuthErrorMessage(rawMessage || message);
      setFormSuccess(null);
      setFormError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnterForgot = () => {
    setView("forgot");
    setErrors({});
    setFormError(null);
    setFormSuccess(null);
    setPassword("");
    setConfirmPassword("");
    toast({
      title: "Reset your password",
      description: "Enter your account email and we'll send a reset link.",
    });
  };

  const getTitle = () => {
    switch (view) {
      case "login": return "Welcome back";
      case "signup": return "Create your account";
      case "forgot": return "Reset password";
      case "verify": return "Check your email";
    }
  };

  const getDescription = () => {
    switch (view) {
      case "login": return "Sign in to track your academic workload";
      case "signup": return "Start organizing your semester today";
      case "forgot": return "Enter your email to receive a reset code";
      case "verify": return "Enter the 6-digit code sent to your email";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md animate-slide-up shadow-medium">
        <CardHeader className="text-center space-y-4">
          <div className={cn(
            "mx-auto w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            view === "signup" ? "bg-secondary/20" : "bg-primary/10"
          )}>
            {view === "signup" ? (
              <UserPlus className="w-6 h-6 text-secondary-foreground" />
            ) : (
              <BookOpen className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">
              {getTitle()}
            </CardTitle>
            <CardDescription className="mt-2">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {formSuccess}
              </div>
            )}
            {view !== "verify" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                  disabled={view === "verify"}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}

            {view === "verify" && (
              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="otp">Verification Code</Label>
                <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {view !== "forgot" && view !== "verify" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={handleEnterForgot}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {view === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {view === "login" ? "Sign in" : view === "signup" ? "Create account" : view === "forgot" ? "Send reset code" : "Verify code"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {view === "forgot" ? (
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView(view === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {view === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            )}
          </div>
          {showDebugPanel && (
            <div className="mt-4 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-left text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Auth Debug</p>
              <p>origin: {window.location.origin}</p>
              <p>path: {window.location.pathname}</p>
              <p>view: {view}</p>
              <p>hasRecoveryParams: {String(hasRecoveryParams)}</p>
              <p>loading: {String(loading)}</p>
              <p>lastErrorCode: {lastAuthErrorCode ?? "-"}</p>
              <p>lastErrorMessage: {lastAuthErrorMessage ?? "-"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

