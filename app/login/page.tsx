"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/context/AppContext"
import { auth } from "@/lib/firebase/config"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth"
import {
  Monitor,
  Zap,
  Target,
  TrendingUp,
  Phone,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"

export default function LoginPage() {
  const { user } = useApp()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Mode: "signin" | "signup"
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  // Form Fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Check local storage for onboarding state
      const raw = localStorage.getItem("leadgen_pro_state_" + user.id)
      const state = raw ? JSON.parse(raw) : {}
      if (state.onboardingComplete) {
        router.replace("/search")
      } else {
        router.replace("/onboarding")
      }
    }
  }, [user, router])

  // Handle Firebase Google Authentication
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      // Redirection is handled reactively by the user condition / useEffect above
    } catch (err: any) {
      console.error("[Auth] Google Sign-In failed:", err)
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Firebase Email/Password Auth (Login & Sign Up)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    if (mode === "signup" && !name) {
      setError("Please enter your name.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        // Register new user
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        // Update display name
        if (credential.user) {
          await updateProfile(credential.user, {
            displayName: name,
          })
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password)
      }
      // Redirection is handled reactively
    } catch (err: any) {
      console.error("[Auth] Email Auth error:", err)
      let displayError = "An error occurred during authentication."
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        displayError = "Invalid email or password."
      } else if (err.code === "auth/email-already-in-use") {
        displayError = "This email is already in use. Try signing in."
      } else if (err.code === "auth/invalid-email") {
        displayError = "Please enter a valid email address."
      } else if (err.code === "auth/weak-password") {
        displayError = "Password should be at least 6 characters."
      }
      setError(displayError)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: <Target size={14} />, text: "Context-aware lead scoring for your seller type" },
    { icon: <Phone size={14} />, text: "4-layer phone extraction — 80%+ success rate" },
    { icon: <TrendingUp size={14} />, text: "AI pitch suggestions for every lead" },
    { icon: <Zap size={14} />, text: "Results in under 5 seconds" },
  ]

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex" }}>
      <div className="bg-glow" />
      <div className="bg-glow-2" />

      {/* Left Panel */}
      <div
        className="hero-panel"
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
          zIndex: 1,
          display: "none", // Styled via globals.css for desktop screens
        }}
      >
        {/* Will show on large screens via CSS */}
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
           {/* Logo */}
           <div 
             style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, cursor: "pointer" }}
             onClick={() => router.push("/")}
           >
             <img
               src="/leadgenpro_logo.png"
               alt="LeadGen Pro Logo"
               style={{
                 width: "40px",
                 height: "40px",
                 objectFit: "contain",
                 borderRadius: "10px",
               }}
             />
             <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
               LeadGen <span style={{ color: "var(--accent-light)" }}>Pro</span>
             </span>
           </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            {mode === "signin"
              ? "Sign in to access your leads and search pipeline."
              : "Get started for free and start finding high-scoring leads."}
          </p>

          {/* Google Sign In Button */}
          <button
            className="btn btn-secondary w-full"
            type="button"
            style={{
              justifyContent: "center",
              padding: "14px",
              marginBottom: 20,
              borderRadius: 12,
              gap: 10,
              cursor: loading ? "wait" : "pointer"
            }}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Or use email</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#f87171",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Login/Signup Form */}
          <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {mode === "signup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Name</label>
                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 42px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 42px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 42px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
              style={{
                justifyContent: "center",
                padding: "14px",
                borderRadius: 12,
                marginTop: 8,
                cursor: loading ? "wait" : "pointer"
              }}
            >
              {loading ? (
                <div className="spinner" style={{ marginRight: 8 }} />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Sign Up"}
                  <ArrowRight size={16} style={{ marginLeft: 8 }} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Form Mode */}
          <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24 }}>
            {mode === "signin" ? "New to LeadGen Pro?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin")
                setError(null)
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-light)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
                textDecoration: "underline"
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in here"}
            </button>
          </p>

          {/* Feature list */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              What you get
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: "var(--accent-light)" }}>{f.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 20 }}>
            Real API keys needed for live search.
            <br />
            A product of <a href="https://renvixteach.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "underline" }}>Renvix Technologies</a>
          </p>
        </div>
      </div>
    </div>
  )
}
