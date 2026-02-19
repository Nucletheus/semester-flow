import { useEffect, useMemo, useState } from "react";
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

// Schema for Login
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = loginSchema.extend({ password: strongPasswordSchema });

type AuthView = "login" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
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
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
      } else if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: appOrigin },
        });
        if (error) throw error;

        if (data.session) {
          toast({
            title: "Account created",
            description: "You're signed in and ready to go.",
          });
          navigate("/", { replace: true });
          return;
        }

        toast({
          title: "Account created!",
          description: "Check your email for verification. You can sign in as soon as your project auth settings allow it.",
        });
      } else if (view === "forgot") {
        const recoveryEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
          redirectTo: `${appOrigin}/update-password`,
        });
        if (error) throw error;
        toast({
          title: "Reset link sent",
          description: `If an account exists for ${recoveryEmail}, a password reset link has been sent.`,
        });
        setView("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      let message = error.message;
      const errorCode = error?.code;
      if (error.message.includes("User already registered")) {
        message = "This email is already registered. Try signing in instead.";
      } else if (errorCode === "email_not_confirmed" || error.message.includes("Email not confirmed")) {
        message = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      } else if (errorCode === "over_email_send_rate_limit" || error.message.includes("rate limit")) {
        message = "Too many reset emails were requested. Please wait and try again.";
      } else if (errorCode === "otp_expired" || error.message.toLowerCase().includes("expired")) {
        message = "This reset link has expired. Please request a new one.";
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnterForgot = () => {
    setView("forgot");
    setErrors({});
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
    }
  };

  const getDescription = () => {
    switch (view) {
      case "login": return "Sign in to track your academic workload";
      case "signup": return "Start organizing your semester today";
      case "forgot": return "Enter your email to receive a reset link";
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {view !== "forgot" && (
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
              {view === "login" ? "Sign in" : view === "signup" ? "Create account" : "Send reset link"}
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
        </CardContent>
      </Card>
    </div>
  );
}

