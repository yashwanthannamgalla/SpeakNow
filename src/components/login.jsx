import { useState } from "react";

export default function Login({ onLogin, onSignup, onClose }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
          "Login failed."
        );
        return;
      }

      localStorage.setItem(
        "skillenhancer_token",
        data.token
      );

      localStorage.setItem(
        "skillenhancer_user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);

    } catch (err) {

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <div className="auth-overlay">

      <div className="login-card">


        {/* ======================================================
            CLOSE
            ====================================================== */}

        <button
          className="auth-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>


        {/* ======================================================
            BRAND
            ====================================================== */}

        <div className="login-brand">

          <div className="login-logo">
            SkillEnhancer
          </div>

          <span className="login-brand-dot" />

        </div>


        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="login-header">

          <p className="login-eyebrow">
            WELCOME BACK
          </p>

          <h1>
            Continue learning.
          </h1>

          <p className="login-subtitle">
            Pick up where you left off
            and keep improving your English.
          </p>

        </div>


        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        {/* ======================================================
            FORM
            ====================================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >


          {/* EMAIL */}

          <div className="login-field">

            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
            />

          </div>


          {/* PASSWORD */}

          <div className="login-field">

            <div className="login-label-row">

              <label htmlFor="login-password">
                Password
              </label>

            </div>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
            />

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Log in"}

            {!loading && (
              <span>→</span>
            )}

          </button>

        </form>


        {/* ======================================================
            SIGN UP
            ====================================================== */}

        <div className="login-footer">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={onSignup}
          >
            Create one
          </button>

        </div>


      </div>

    </div>

  );
}