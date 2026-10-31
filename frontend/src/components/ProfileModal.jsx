import { useState } from "react";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(String(dataUrl));
    } catch {
      setError("Could not read the selected image.");
    }

    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (displayName.trim().length > 40) {
      setError("Display name must be 40 characters or less.");
      return;
    }

    if (avatarUrl.length > 5 * 1024 * 1024) {
      setError("Avatar is too large.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ displayName: displayName.trim(), avatarUrl });
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

          <div>
            <p className="modal-label">Profile picture</p>
            <div className="avatar-row">
              <div className="avatar-preview large">
                {avatarUrl ? (
                  <img alt="Avatar preview" src={avatarUrl} />
                ) : (
                  <span>{(displayName || user.email || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="avatar-actions">
                <label className="secondary-button avatar-button">
                  Choose from computer
                  <input
                    accept="image/*"
                    disabled={saving}
                    onChange={handleFileChange}
                    type="file"
                  />
                </label>
                {avatarUrl && (
                  <button
                    className="text-button"
                    disabled={saving}
                    onClick={() => setAvatarUrl("")}
                    type="button"
                  >
                    Remove photo
                  </button>
                )}
                <span className="field-hint">JPG, PNG, GIF or WebP · max 2 MB</span>
              </div>
            </div>
          </div>

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
