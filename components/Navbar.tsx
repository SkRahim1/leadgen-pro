"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, LayoutDashboard, Settings, LogOut, Zap, User, LayoutList } from "lucide-react"
import { useApp } from "@/lib/context/AppContext"

export default function Navbar() {
  const { user, savedLeads, logout } = useApp()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: "/search", label: "Search", icon: Search },
    { href: "/my-leads", label: "My Leads", icon: LayoutList },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  const hotCount = savedLeads.filter(l => l.priority === "HOT" && l.status === "NEW").length

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div
          className="navbar-logo"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <img
            src="/leadgenpro_logo.png"
            alt="Renvix LeadFlow Logo"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
          <span>
            <span style={{ color: "var(--text-primary)" }}>Renvix</span>
            <span style={{ color: "var(--accent-light)" }}> LeadFlow</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="desktop-nav">
          <div className="navbar-nav" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname.startsWith(href) ? "active" : ""}`}
              >
                <Icon size={14} />
                {label}
                {href === "/dashboard" && hotCount > 0 && (
                  <span style={{
                    background: "var(--hot)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "99px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}>
                    {hotCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Plan badge */}
          <span className="tag tag-info" style={{ fontSize: "10px", fontWeight: 700 }}>
            <Zap size={10} />
            {user?.plan || "FREE"}
          </span>

          {/* User avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--cold))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "white",
            cursor: "pointer",
          }}>
            {user?.name?.[0]?.toUpperCase() || <User size={14} />}
          </div>

          {/* Logout */}
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={() => {
              logout()
              router.push("/login")
            }}
            title="Sign out"
            style={{ borderRadius: "50%", padding: 0, width: 32, height: 32 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-link ${pathname.startsWith(href) ? "active" : ""}`}
          >
            <Icon size={18} />
            <span style={{ fontSize: "10px", marginTop: 2 }}>{label}</span>
            {href === "/dashboard" && hotCount > 0 && (
              <span style={{
                position: "absolute",
                top: "4px",
                right: "calc(50% - 20px)",
                background: "var(--hot)",
                color: "white",
                fontSize: "9px",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: "99px",
                minWidth: "15px",
                textAlign: "center",
              }}>
                {hotCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  )
}
