import { useState } from "react";

export default function AuthPage({ onAuthenticate, initialMessage = "" }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Your password must be between 8 and 128 characters.");
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("The passwords don’t match.");
      return;
    }

    setSubmitting(true);
    try {
      await onAuthenticate(mode, email.trim(), password);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <a className="auth-brand" href="#" aria-label="Spendora home">
          <span className="brand-symbol" aria-hidden="true">S</span>
          <span>spendora</span>
        </a>

        <div className="auth-heading">
          <p className="eyebrow">{isRegister ? "First time here?" : "Welcome back"}</p>
          <h1 id="auth-title">{isRegister ? "Create your account" : "Log in to Spendora"}</h1>
          <p>
            {isRegister
              ? "Create an account to keep your income and expenses together."
              : "Enter your account details to view your money overview."}
          </p>
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

          <label>
            Password
            {isRegister && <span className="field-hint">8 to 128 characters</span>}
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
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

          {isRegister && (
            <label>
              Confirm password
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
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" disabled={submitting} type="submit">
            {submitting
              ? (isRegister ? "Creating account…" : "Logging in…")
              : (isRegister ? "Create account" : "Log in")}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Spendora?"}{" "}
          <button
            disabled={submitting}
            onClick={() => changeMode(isRegister ? "login" : "register")}
            type="button"
          >
            {isRegister ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
