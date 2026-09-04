import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { loginUser, registerUser } from "../services/auth";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = isRegister
        ? await registerUser(email, password)
        : await loginUser(email, password);

      localStorage.setItem("token", data.access_token);

      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      {/* Logo */}
      <div className="auth-logo">
        Market<span>Lens</span>
      </div>

      {/* Auth Card */}
      <div className="auth-card">

        <div className="auth-heading">
          <h1>
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>

          <p>
            {isRegister
              ? "Create your MarketLens account."
              : "Sign in to continue to MarketLens."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="auth-input-group">
            <label>Email</label>

            <div className="auth-input">
              <Mail size={17} />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label>Password</label>

            <div className="auth-input">
              <Lock size={17} />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>

        </form>

        {/* Switch */}
        <div className="auth-switch">
          <span>
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign In" : "Create one"}
          </button>
        </div>

      </div>

      <p className="auth-tagline">
        See what changed. <span>Know what matters.</span>
      </p>

    </div>
  );
}