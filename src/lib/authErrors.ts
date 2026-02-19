type AuthLikeError = {
  code?: string;
  message?: unknown;
};

export const getAuthErrorMessage = (error: unknown): string => {
  const authError = (error ?? {}) as AuthLikeError;
  const code = authError.code;
  const message = typeof authError.message === "string"
    ? authError.message
    : "Unexpected auth error";

  const normalizedMessage = message.toLowerCase();

  if (code === "over_email_send_rate_limit" || normalizedMessage.includes("rate limit")) {
    return "Too many requests. Please wait before trying again.";
  }

  if (code === "otp_expired" || normalizedMessage.includes("expired")) {
    return "This link has expired. Request a new reset link.";
  }

  if (code === "redirect_to_not_allowed") {
    return "This environment is not allowed for auth redirects yet.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }

  if (normalizedMessage.includes("email not confirmed") || code === "email_not_confirmed") {
    return "Please verify your email address before signing in.";
  }

  return message;
};
