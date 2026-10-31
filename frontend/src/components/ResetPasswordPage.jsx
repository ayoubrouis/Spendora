import { useState } from "react";

export default function ResetPasswordPage({ token, onSubmit, onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8 || password.length > 128) {
      setError("Your password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords don’t match.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(token, password);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-title">
        <a className="auth-brand" href="#" aria-label="Spendora home">
          <span className="brand-symbol" aria-hidden="true">S</span>
          <span>spendora</span>
        </a>

        <div className="auth-heading">
          <p className="eyebrow">Reset password</p>
          <h1 id="reset-title">Set a new password</h1>
          <p>This link expires in 30 minutes and can only be used once.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            New password
            <span className="field-hint">8 to 128 characters</span>
            <input
              autoComplete="new-password"
              disabled={submitting}
              maxLength="128"
              minLength="8"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <label>
            Confirm new password
            <input
              autoComplete="new-password"
              disabled={submitting}
              maxLength="128"
              minLength="8"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" disabled={submitting} type="submit">
            {submitting ? "Updating…" : "Update password"}
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
