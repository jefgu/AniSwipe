import { useState } from "react";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,30}$/;

export default function Login({
  backgroundCreditText,
  backgroundCreditUrl,
  onLogin,
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError("Use 2-30 letters, numbers, underscores, or hyphens.");
      return;
    }

    setPending(true);
    setError("");

    try {
      await onLogin(trimmedUsername);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">AniSwipe</p>
        <h1>Login</h1>

        <label htmlFor="username">Username</label>
        <input
          autoComplete="username"
          autoFocus
          id="username"
          maxLength={30}
          minLength={2}
          onChange={(event) => setUsername(event.target.value)}
          pattern="[A-Za-z0-9_-]{2,30}"
          placeholder="makoto_01"
          type="text"
          value={username}
        />

        {error && <p className="inline-error">{error}</p>}

        <button className="primary-button full-width" disabled={pending} type="submit">
          {pending ? "Logging in..." : "Continue"}
        </button>
      </form>

      {backgroundCreditText && backgroundCreditUrl && (
        <a
          className="background-credit login-credit"
          href={backgroundCreditUrl}
          rel="noreferrer"
          target="_blank"
        >
          {backgroundCreditText}
        </a>
      )}
    </main>
  );
}
