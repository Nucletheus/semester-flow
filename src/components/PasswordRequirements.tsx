import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
}

export function PasswordRequirements({ password, confirmPassword }: PasswordRequirementsProps) {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (confirmPassword !== undefined) {
    requirements.push({
      label: "Passwords match",
      met: password === confirmPassword && password.length > 0
    });
  }

  return (
    <div className="space-y-2 text-sm text-muted-foreground mt-2">
      <p className="font-medium text-xs uppercase tracking-wide mb-2">Password Requirements</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-destructive/50" />
            )}
            <span className={cn(req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
