"use client"
/**
 * @module lib/context/AppContext
 * @description Global app state using React Context + Firebase Auth + localStorage persistence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { ScoredLead } from "@/types/lead.types"
import { auth } from "@/lib/firebase/config"
import { onAuthStateChanged, signOut } from "firebase/auth"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  plan: "FREE" | "STARTER" | "PRO" | "BUSINESS"
}

export interface SellerProfile {
  sellerType: string
  sellerLabel: string
  industryGroup: string
  whatISell: string
  targetTypes: string[]
  targetCity: string
  searchExamples: string[]
  hotSignals: {
    noWebsite: boolean
    newlyOpened: boolean
    lowReviews: boolean
    noSocialMedia: boolean
    manyEmployees: boolean
    phoneAvailable: boolean
    notVerified: boolean
    lowRating: boolean
  }
  pitchTemplate: string
}

export interface SavedLead extends ScoredLead {
  savedAt: string
  status: "NEW" | "CONTACTED" | "INTERESTED" | "CONVERTED" | "NOT_INTERESTED"
  notes: string
}

export interface AppState {
  user: UserProfile | null
  sellerProfile: SellerProfile | null
  savedLeads: SavedLead[]
  isLoggedIn: boolean
  onboardingComplete: boolean
}

interface AppContextValue extends AppState {
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  login: (user: UserProfile) => void
  logout: () => void
  saveSellerProfile: (profile: SellerProfile) => void
  saveLead: (lead: ScoredLead) => void
  removeLead: (placeId: string) => void
  updateLeadStatus: (placeId: string, status: SavedLead["status"]) => void
  updateLeadNotes: (placeId: string, notes: string) => void
  isLeadSaved: (placeId: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

const STORAGE_KEY = "leadgen_pro_state"

const DEFAULT_STATE: AppState = {
  user: null,
  sellerProfile: null,
  savedLeads: [],
  isLoggedIn: false,
  onboardingComplete: false,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const [theme, setThemeState] = useState<"light" | "dark">("dark")

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("leadgen_pro_theme") as "light" | "dark"
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme)
      }
    } catch (_) {}
  }, [])

  // Apply and persist theme
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme")
    } else {
      document.body.classList.remove("light-theme")
    }
    try {
      localStorage.setItem("leadgen_pro_theme", theme)
    } catch (_) {}
  }, [theme])

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    setThemeState(newTheme)
  }, [])

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to our UserProfile format
        const profile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
          plan: "FREE", // Default plan
        }

        // Load user-specific settings from localStorage
        const userKey = `${STORAGE_KEY}_${firebaseUser.uid}`
        let userState = {
          sellerProfile: null,
          savedLeads: [],
          onboardingComplete: false,
        }
        try {
          const raw = localStorage.getItem(userKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            userState = {
              sellerProfile: parsed.sellerProfile || null,
              savedLeads: parsed.savedLeads || [],
              onboardingComplete: parsed.onboardingComplete || false,
            }
          }
        } catch (_) {}

        setState({
          user: profile,
          isLoggedIn: true,
          sellerProfile: userState.sellerProfile,
          savedLeads: userState.savedLeads,
          onboardingComplete: userState.onboardingComplete,
        })
      } else {
        // Logged out
        setState(DEFAULT_STATE)
      }
      setHydrated(true)
    })

    return () => unsubscribe()
  }, [])

  // Persist user-specific data to localStorage on changes
  useEffect(() => {
    if (!hydrated || !state.isLoggedIn || !state.user?.id) return
    
    const userKey = `${STORAGE_KEY}_${state.user.id}`
    localStorage.setItem(
      userKey,
      JSON.stringify({
        sellerProfile: state.sellerProfile,
        savedLeads: state.savedLeads,
        onboardingComplete: state.onboardingComplete,
      })
    )
  }, [
    state.sellerProfile,
    state.savedLeads,
    state.onboardingComplete,
    state.isLoggedIn,
    state.user,
    hydrated
  ])

  // Login handler
  const login = useCallback((user: UserProfile) => {
    setState(prev => ({ ...prev, user, isLoggedIn: true }))
  }, [])

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("[AppContext] Logout error:", err)
    }
  }, [])

  const saveSellerProfile = useCallback((profile: SellerProfile) => {
    setState(prev => ({ ...prev, sellerProfile: profile, onboardingComplete: true }))
  }, [])

  const saveLead = useCallback((lead: ScoredLead) => {
    setState(prev => {
      const exists = prev.savedLeads.some(l => l.placeId === lead.placeId)
      if (exists) return prev
      const savedLead: SavedLead = {
        ...lead,
        savedAt: new Date().toISOString(),
        status: "NEW",
        notes: "",
      }
      return { ...prev, savedLeads: [savedLead, ...prev.savedLeads] }
    })
  }, [])

  const removeLead = useCallback((placeId: string) => {
    setState(prev => ({
      ...prev,
      savedLeads: prev.savedLeads.filter(l => l.placeId !== placeId),
    }))
  }, [])

  const updateLeadStatus = useCallback((placeId: string, status: SavedLead["status"]) => {
    setState(prev => ({
      ...prev,
      savedLeads: prev.savedLeads.map(l =>
        l.placeId === placeId ? { ...l, status } : l
      ),
    }))
  }, [])

  const updateLeadNotes = useCallback((placeId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      savedLeads: prev.savedLeads.map(l =>
        l.placeId === placeId ? { ...l, notes } : l
      ),
    }))
  }, [])

  const isLeadSaved = useCallback((placeId: string) => {
    return state.savedLeads.some(l => l.placeId === placeId)
  }, [state.savedLeads])

  if (!hydrated) return null

  return (
    <AppContext.Provider value={{
      ...state,
      theme,
      setTheme,
      login,
      logout,
      saveSellerProfile,
      saveLead,
      removeLead,
      updateLeadStatus,
      updateLeadNotes,
      isLeadSaved,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
