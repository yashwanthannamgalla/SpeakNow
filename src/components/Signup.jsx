import { useState } from "react";
import { apiUrl } from "../config/api";

export default function Signup({ onSignup, onLogin, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        apiUrl("/api/signup"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Signup failed.");
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

      onSignup(data.user);

    } catch {
      setError("Unable to connect to the server.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">

      <div className="login-card">

        <button
          className="auth-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="login-logo">
          SkillEnhancer
        </div>

        <h1>Create account</h1>

        <p className="login-subtitle">
          Start improving your English today.
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          <div className="login-field">

            <label>Name</label>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>


          {/* EMAIL */}

          <div className="login-field">

            <label>Email</label>

            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          {/* PASSWORD */}

          <div className="login-field">

            <label>Password</label>

            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>


        {/* LOGIN */}

        <div className="signup-text">

          Already have an account?

          <button onClick={onLogin}>
            Log in
          </button>

        </div>

      </div>

    </div>
  );
}
