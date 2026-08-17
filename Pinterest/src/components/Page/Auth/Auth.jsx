import { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";

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
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: safeEmail,
          password
        })
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        alert(data?.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/dashboard", {
        state: {
          selectedInterests: data.user?.selectedInterests || []
        }
      });
    } catch (error) {
      console.error("Login request failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE */}
      <div className="auth-visual">

        <div className="visual-overlay">
          <h2>
            Discover something worth learning.
          </h2>

          <p>
            Find ideas, save resources and build
            your own learning space.
          </p>
        </div>

        <div className="floating-card card-one">
          React
        </div>

        <div className="floating-card card-two">
          JavaScript
        </div>

        <div className="floating-card card-three">
          AI
        </div>

        <div className="floating-card card-four">
          Playwright
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="auth-section">

        <div className="auth-container">

          <h1>PinLearn</h1>

          <p>
            {isLogin
              ? "Welcome back"
              : "Create your account"}
          </p>

          {/* FORM */}
          {isLogin ? (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                maxLength={100}
                autoComplete="email"
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                maxLength={50}
                autoComplete="current-password"
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                maxLength={50}
                autoComplete="name"
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                maxLength={100}
                autoComplete="email"
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Create password"
                value={password}
                maxLength={50}
                autoComplete="new-password"
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                maxLength={50}
                autoComplete="new-password"
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </>
          )}

          <button
            onClick={
              isLogin
                ? handleLogin
                : handleSignup
            }
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>

          {/* SWITCH LOGIN / SIGNUP */}
          <p className="signup-text">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <span
              onClick={() => {
                setIsLogin(!isLogin);

                // Clear fields when switching
                setName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {isLogin
                ? " Sign Up"
                : " Log In"}
            </span>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Auth;