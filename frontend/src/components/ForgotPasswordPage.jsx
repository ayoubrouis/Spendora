import { useState } from "react";

export default function ForgotPasswordPage({ onSubmit, onBack }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(email.trim());
      setMessage(result.message || "If an account with that email exists, a password reset link has been sent.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forgot-title">
        <a className="auth-brand" href="#" aria-label="Spendora home">
          <span className="brand-symbol" aria-hidden="true">S</span>
          <span>spendora</span>
        </a>

        <div className="auth-heading">
          <p className="eyebrow">Reset password</p>
          <h1 id="forgot-title">Forgot your password?</h1>
          <p>We’ll send a reset link to your email if an account exists.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email address
            <input
              autoComplete="email"
              autoCapitalize="none"
              disabled={submitting}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          {message && <p className="verify-note">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" disabled={submitting} type="submit">
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="auth-switch">
          <button disabled={submitting} onClick={onBack} type="button">
            Back to log in
          </button>
        </p>
      </section>
    </main>
  );
}
