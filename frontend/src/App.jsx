import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "./api/client.js";
import { clearToken, forgotPassword, getCurrentUser, login, logout, register, resetPassword, resendVerification, updateProfile, verifyEmail } from "./api/auth.js";
import { createTransaction, getTransactions, removeTransaction, updateTransaction } from "./api/transactions.js";
import AuthPage from "./components/AuthPage.jsx";
import ForgotPasswordPage from "./components/ForgotPasswordPage.jsx";
import InsightsPanel from "./components/InsightsPanel.jsx";
import ProfileModal from "./components/ProfileModal.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import TransactionForm from "./components/TransactionForm.jsx";
import TransactionList from "./components/TransactionList.jsx";
import VerifyPendingPage from "./components/VerifyPendingPage.jsx";

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "insights", label: "Insights" },
  { id: "transactions", label: "Transactions" },
  { id: "about", label: "About" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));
  const [authNotice, setAuthNotice] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [verifying, setVerifying] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get("verify")),
  );
  const [resetting, setResetting] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get("reset")),
  );
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset") || "");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const search = window.location.search;
    // Verification/reset links are handled by their own effects; skip session check
    // to avoid races (e.g. clearing the token a link just saved).
    if (new URLSearchParams(search).get("verify") || new URLSearchParams(search).get("reset")) {
      setAuthLoading(false);
      return undefined;
    }

    if (!getToken()) {
      return undefined;
    }

    let active = true;
    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (error.status === 401) {
          clearToken();
          setAuthNotice("Your session ended. Log in to continue.");
        } else {
          setAuthNotice(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verify");
    const resetLinkToken = params.get("reset");

    if (verifyToken) {
      // Clean the token out of the address bar before doing anything else.
      window.history.replaceState({}, "", window.location.pathname);
      setVerifying(true);

      verifyEmail(verifyToken)
        .then((verifiedUser) => {
          setAuthNotice("");
          setUser(verifiedUser);
          setActionMessage("Email verified. Welcome to Spendora.");
        })
        .catch((error) => setAuthNotice(error.message))
        .finally(() => setVerifying(false));
      return undefined;
    }

    if (resetLinkToken) {
      window.history.replaceState({}, "", window.location.pathname);
      setResetToken(resetLinkToken);
      setResetting(true);
      return undefined;
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      setLoadError("");
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError("");

    getTransactions({ signal: controller.signal })
      .then(setTransactions)
      .catch((error) => {
        if (error.name !== "AbortError") {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadKey, user]);

  useEffect(() => {
    function expireSession() {
      clearToken();
      setUser(null);
      setTransactions([]);
      setAuthNotice("Your session ended. Log in to continue.");
    }

    window.addEventListener("spendora:session-expired", expireSession);
    return () => window.removeEventListener("spendora:session-expired", expireSession);
  }, []);

  useEffect(() => {
    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    function closeOnDesktopResize() {
      if (window.innerWidth > 820) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, [menuOpen]);

  // Highlights whichever sidebar section is currently in view. The sections
  // only exist once the overview is rendered, so loading/loadError are observed
  // to re-run this after the content appears.
  useEffect(() => {
    if (!user) {
      setActiveSection("overview");
      return undefined;
    }

    let sections = [];
    let frame = 0;

    function collectSections() {
      sections = NAV_SECTIONS
        .map((section) => document.getElementById(section.id))
        .filter(Boolean);
    }

    function updateActiveSection() {
      frame = 0;
      if (sections.length === 0) {
        return;
      }

      const marker = window.scrollY + 140;
      const pageHeight = document.documentElement.scrollHeight;

      // At the very bottom the last section can never pass the marker, so pick
      // it explicitly. Only when the page actually scrolls, otherwise a short
      // page would highlight the last section while sitting at the top.
      const canScroll = pageHeight > window.innerHeight + 8;
      const atBottom = canScroll && window.scrollY + window.innerHeight >= pageHeight - 8;
      let current = sections[0].id;

      for (const section of sections) {
        if (section.offsetTop <= marker) {
          current = section.id;
        }
      }

      setActiveSection(atBottom ? sections[sections.length - 1].id : current);
    }

    function requestUpdate() {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    }

    collectSections();
    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [user, loading, loadError]);

  const totals = useMemo(() => {
    const income = transactions.reduce(
      (total, item) => item.type === "income" ? total + Number(item.amount) : total,
      0,
    );
    const expense = transactions.reduce(
      (total, item) => item.type === "expense" ? total + Number(item.amount) : total,
      0,
    );
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  async function handleAuthenticate(mode, email, password) {
    if (mode === "register") {
      const result = await register(email, password);
      setAuthNotice("");
      setPendingVerification({
        email: result.email || email,
        devUrl: result.verificationUrl || "",
      });
      return;
    }

    try {
      const authenticatedUser = await login(email, password);
      setAuthNotice("");
      setUser(authenticatedUser);
    } catch (error) {
      // 403 means the password was right but the email is not verified yet.
      if (error.status === 403) {
        setPendingVerification({ email, devUrl: "" });
        return;
      }
      throw error;
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      setAuthNotice(`You were logged out here, but the server could not end the session: ${error.message}`);
    } finally {
      setUser(null);
      setTransactions([]);
      setLoading(false);
    }
  }

  async function handleCreate(type, transaction) {
    setSubmitting(true);
    setActionError("");
    setActionMessage("");
    try {
      await createTransaction(type, transaction);
      setPage(1);
      setActionMessage("Transaction saved.");
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitTransaction(type, transaction) {
    if (!editingTransaction) {
      await handleCreate(type, transaction);
      return;
    }

    setSubmitting(true);
    setUpdatingId(editingTransaction._id);
    setActionError("");
    setActionMessage("");
    try {
      await updateTransaction(editingTransaction.type, editingTransaction._id, transaction);
      setEditingTransaction(null);
      setActionMessage("Transaction updated.");
      reload();
    } finally {
      setSubmitting(false);
      setUpdatingId("");
    }
  }

  function handleEdit(transaction) {
    setEditingTransaction(transaction);
    setActionError("");
    setActionMessage("");
    document.getElementById("transaction-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleCancelEdit() {
    setEditingTransaction(null);
    setUpdatingId("");
  }

  async function handleDelete(transaction) {
    if (!window.confirm(`Delete "${transaction.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(transaction._id);
    setActionError("");
    setActionMessage("");
    try {
      await removeTransaction(transaction.type, transaction._id);
      setTransactions((current) =>
        current.filter((item) => item._id !== transaction._id),
      );
      if (editingTransaction?._id === transaction._id) {
        setEditingTransaction(null);
      }
      setActionMessage("Transaction deleted.");
    } catch (error) {
      setActionError(error.message);
    } finally {
      setDeletingId("");
    }
  }

  function updateFilter(nextFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  if (verifying) {
    return (
      <main className="auth-loading-page" role="status" aria-live="polite">
        <span className="loading-dot" aria-hidden="true" />
        Verifying your email…
      </main>
    );
  }

  if (resetting) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onSubmit={async (token, password) => {
          await resetPassword(token, password);
          setResetting(false);
          setAuthNotice("Password updated. You can log in.");
        }}
        onBack={() => {
          setResetting(false);
          setResetToken("");
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <main className="auth-loading-page" role="status">
        <span className="loading-dot" aria-hidden="true" />
        Checking your session…
      </main>
    );
  }

  if (!user && showForgotPassword) {
    return (
      <ForgotPasswordPage
        onSubmit={forgotPassword}
        onBack={() => setShowForgotPassword(false)}
      />
    );
  }

  if (!user && pendingVerification) {
    return (
      <VerifyPendingPage
        email={pendingVerification.email}
        initialDevUrl={pendingVerification.devUrl}
        onResend={resendVerification}
        onBack={() => setPendingVerification(null)}
      />
    );
  }

  if (!user) {
    return (
      <AuthPage
        initialMessage={authNotice}
        onAuthenticate={handleAuthenticate}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          aria-label="Close navigation"
          className="drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`sidebar${menuOpen ? " sidebar-open" : ""}`}
        id="primary-navigation"
      >
        <a className="brand" href="#" aria-label="Spendora home">
          <span className="brand-symbol" aria-hidden="true">S</span>
          <span>spendora</span>
        </a>
        <nav aria-label="Sections">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              className={activeSection === section.id ? "nav-link active" : "nav-link"}
              href={`#${section.id}`}
              aria-current={activeSection === section.id ? "location" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-indicator" aria-hidden="true" />
              {section.label}
            </a>
          ))}
        </nav>
        <button
          className="sidebar-profile"
          onClick={() => {
            setMenuOpen(false);
            setShowProfile(true);
          }}
          type="button"
        >
          <span className="sidebar-avatar">
            {user.avatarUrl ? (
              <img alt="" src={user.avatarUrl} />
            ) : (
              (user.displayName || user.email || "U").charAt(0).toUpperCase()
            )}
          </span>
          <span className="sidebar-profile-text">
            <span className="sidebar-profile-name">{user.displayName || user.email}</span>
            <span className="sidebar-profile-meta">Edit profile</span>
          </span>
        </button>
        <p className="sidebar-note">Personal money tracker</p>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <div className="mobile-brand">
            <span className="brand-symbol" aria-hidden="true">S</span>
            spendora
          </div>
          <p className="today-label">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
          <span className="account-email">{user.email}</span>
          <span className={`connection-status ${online ? "is-online" : "is-offline"}`}>
            <span aria-hidden="true" />
            {online ? "Online" : "Offline"}
          </span>
          <button className="logout-button" onClick={handleLogout} type="button">
            Log out
          </button>
        </header>

        <div className="page-content">
          <div className="page-title-row">
            <div>
              <p className="eyebrow">Your finances</p>
              <h1>Money overview</h1>
              <p className="page-description">A clear view of what’s coming in and going out.</p>
            </div>
            <button className="refresh-button" onClick={reload} disabled={loading} type="button">
              {loading ? "Updating…" : "Refresh"}
            </button>
          </div>

          {!online && (
            <div className="notice notice-warning" role="status">
              You’re offline. Saved transactions are unavailable until your connection returns.
            </div>
          )}
          {actionError && (
            <div className="notice notice-error" role="alert">
              {actionError}
            </div>
          )}
          {actionMessage && (
            <div className="notice notice-success" role="status">
              {actionMessage}
            </div>
          )}

          {loading && transactions.length === 0 ? (
            <div className="loading-state" role="status" aria-live="polite">
              <span className="loading-dot" aria-hidden="true" />
              Loading your transactions…
            </div>
          ) : loadError ? (
            <div className="load-error" role="alert">
              <div>
                <h2>Couldn’t load your transactions</h2>
                <p>{loadError}</p>
              </div>
              <button className="secondary-button" onClick={reload} type="button">
                Try again
              </button>
            </div>
          ) : (
            <>
              <SummaryCards totals={totals} />
              {loading && transactions.length > 0 && (
                <p className="refreshing-note" role="status">Updating transaction list…</p>
              )}
              <InsightsPanel transactions={transactions} />
              <div className="content-grid">
                <TransactionList
                  transactions={transactions}
                  filter={filter}
                  onFilterChange={updateFilter}
                  page={page}
                  onPageChange={setPage}
                  deletingId={deletingId}
                  updatingId={updatingId}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
                <TransactionForm
                  onSubmit={handleSubmitTransaction}
                  submitting={submitting}
                  transactions={transactions}
                  editTransaction={editingTransaction}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
              <section className="about-section" id="about" aria-labelledby="about-title">
                <header className="about-header">
                  <p className="eyebrow">About</p>
                  <h2 id="about-title">About Spendora</h2>
                </header>
                <div className="about-card">
                  <p>
                    Spendora is a simple, personal money tracker. Record income and expenses, see where
                    money goes, and keep an eye on your balance over time.
                  </p>
                  <p>
                    It’s built to stay lightweight: email verification to cut down on fake accounts,
                    password reset by link, local charts, CSV export, and just enough features to be
                    useful without getting in your way.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={async (payload) => {
            const result = await updateProfile(payload);
            setUser((current) => ({ ...(current || {}), ...(result.user || payload) }));
            setActionMessage("Profile updated.");
          }}
        />
      )}
    </div>
  );
}
