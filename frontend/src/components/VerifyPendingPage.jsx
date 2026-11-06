import { useState } from "react";

export default function VerifyPendingPage({ email, onResend, onBack }) {
  const [message, setMessage] = useState(
    "Open the link in that email to finish creating your account.",
  );
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    setError("");
    try {
      const result = await onResend(email);
      setMessage(result.message || "A new verification link has been sent.");
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="verify-title">
        <a className="auth-brand" href="#" aria-label="Spendora home">
          <span className="brand-symbol" aria-hidden="true">S</span>
          <span>spendora</span>
        </a>

        <div className="auth-heading">
          <p className="eyebrow">One last step</p>
          <h1 id="verify-title">Check your inbox</h1>
          <p>
            We sent a verification link to <strong>{email}</strong>.
          </p>
        </div>

        <p className="verify-note">{message}</p>
        <p className="verify-note">
          The link works for 24 hours. Unverified accounts are removed automatically after that,
          so confirm soon.
        </p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary-button auth-submit"
          disabled={sending}
          onClick={handleResend}
          type="button"
        >
          {sending ? "Sending…" : "Resend verification email"}
        </button>

        <p className="auth-switch">
          Wrong address?{" "}
          <button disabled={sending} onClick={onBack} type="button">
            Go back
          </button>
        </p>
      </section>
    </main>
  );
}
