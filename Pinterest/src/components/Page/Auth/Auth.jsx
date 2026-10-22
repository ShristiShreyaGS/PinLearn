import { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import { login, storeSession } from "../../../api/user";

function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email Validation
  const validateEmail = (email) => {
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // Strong Password Validation
  const validatePassword = (password) => {
    /*
      Minimum:
      - 8 characters
      - One uppercase
      - One lowercase
      - One number
      - One special character
    */
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return passwordRegex.test(password);
  };

  // Input Sanitization
  const sanitizeInput = (value) => {
    return value.trim();
  };

  const handleSignup = async () => {
    const safeName = sanitizeInput(name);
    const safeEmail = sanitizeInput(email);

    if (!safeName || !safeEmail || !password || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }

    if (safeName.length < 2) {
      alert("Name must contain at least 2 characters.");
      return;
    }

    if (!validateEmail(safeEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "Password must be at least 8 characters long and include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    navigate("/interests", {
      state: {
        isNewUser: true,
        pendingSignup: {
          name: safeName,
          email: safeEmail,
          password
        }
      }
    });
  };

  const handleLogin = async () => {
    const safeEmail = sanitizeInput(email);

    if (!safeEmail || !password) {
      alert("Email and Password are required.");
      return;
    }

    if (!validateEmail(safeEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const data = await login({
        email: safeEmail,
        password
      });

      storeSession(data);

      navigate("/dashboard", {
        state: {
          selectedInterests: data.user?.selectedInterests || []
        }
      });
    } catch (error) {
      console.error("Login request failed:", error);
      alert(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-visual">
        <div className="visual-header">
          <a className="brand-lockup" href="/" aria-label="PinLearn home">
            <span className="brand-mark">P</span><span>PinLearn</span>
          </a>
          <span className="brand-motto">LEARN · SAVE · GROW</span>
        </div>

        <div className="visual-overlay">
          <h2>Discover something <span>worth learning.</span></h2>
          <p>Find ideas, save resources and build your own learning space — all in one place.</p>
        </div>

        <div className="learning-preview" aria-hidden="true">
          <div className="preview-heading"><strong>My learning</strong></div>
          <div className="preview-row"><span><b>Saved ideas</b><i /></span></div>
          <div className="preview-row"><span><b>Progress</b><i /></span></div>
          <div className="preview-progress"><span /></div>
        </div>

        <div className="floating-card card-one"><span><b>React</b><small>Build modern UIs</small></span><span className="topic-arrow">›</span></div>
        <div className="floating-card card-two"><span><b>JavaScript</b><small>Power the web</small></span><span className="topic-arrow">›</span></div>
        <div className="floating-card card-three"><span><b>AI</b><small>Shape tomorrow</small></span><span className="topic-arrow">›</span></div>
        <div className="floating-card card-four"><span><b>Playwright</b><small>Test with confidence</small></span><span className="topic-arrow">›</span></div>

        <div className="visual-footer"><span />A BRIGHTER YOU. &nbsp; ONE IDEA AT A TIME.</div>
        </section>

        <section className="auth-section">
        <div className="auth-container">
          <a className="form-brand" href="/" aria-label="PinLearn home">
            <span className="brand-mark">P</span><span>PinLearn</span>
          </a>
          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="form-subtitle">{isLogin ? "Log in to continue your learning journey." : "Start building your own learning space."}</p>

          {isLogin ? (
            <>
              <label className="auth-input-wrap"><span className="input-symbol" aria-hidden="true">✉</span><input type="email" placeholder="Email" aria-label="Email" value={email} maxLength={100} autoComplete="email" onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="auth-input-wrap"><input type="password" placeholder="Password" aria-label="Password" value={password} maxLength={50} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} /></label>
            </>
          ) : (
            <>
              <label className="auth-input-wrap"><span className="input-symbol" aria-hidden="true">●</span><input type="text" placeholder="Name" aria-label="Name" value={name} maxLength={50} autoComplete="name" onChange={(e) => setName(e.target.value)} /></label>
              <label className="auth-input-wrap"><span className="input-symbol" aria-hidden="true">✉</span><input type="email" placeholder="Email" aria-label="Email" value={email} maxLength={100} autoComplete="email" onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="auth-input-wrap"><input type="password" placeholder="Create password" aria-label="Create password" value={password} maxLength={50} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} /></label>
              <label className="auth-input-wrap"><input type="password" placeholder="Confirm password" aria-label="Confirm password" value={confirmPassword} maxLength={50} autoComplete="new-password" onChange={(e) => setConfirmPassword(e.target.value)} /></label>
            </>
          )}

          <button className="auth-submit" onClick={isLogin ? handleLogin : handleSignup}>
            <span>{isLogin ? "Log In" : "Sign Up"}</span><span className="submit-arrow" aria-hidden="true">→</span>
          </button>

          <p className="signup-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="auth-switch" type="button" onClick={() => {
              setIsLogin(!isLogin);
              setName("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
            }}>
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
        </section>
      </div>
    </main>
  );
}

export default Auth;