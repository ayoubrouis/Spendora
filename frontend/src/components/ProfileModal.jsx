import { useState } from "react";

export default function ProfileModal({ user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (displayName.trim().length > 40) {
      setError("Display name must be 40 characters or less.");
      return;
    }

    if (avatarUrl.trim().length > 2048) {
      setError("Avatar URL is too long.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ displayName: displayName.trim(), avatarUrl: avatarUrl.trim() });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="modal-panel">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h2 id="profile-title">Edit profile</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label>
            Display name
            <input
              autoComplete="name"
              disabled={saving}
              maxLength="40"
              name="displayName"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="e.g. Ayoub"
              value={displayName}
            />
            <span className="field-hint">Optional · 40 characters max</span>
          </label>

          <label>
            Avatar URL
            <input
              autoComplete="off"
              disabled={saving}
              maxLength="2048"
              name="avatarUrl"
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
            />
            <span className="field-hint">Optional · leave blank to use initials</span>
          </label>

          {avatarUrl.trim() && (
            <div className="avatar-preview">
              <img
                alt="Avatar preview"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                src={avatarUrl.trim()}
              />
            </div>
          )}

          <p className="modal-email">Email: {user.email}</p>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
