"use client"
/**
 * @module lib/context/AppContext
 * @description Global app state using React Context + Firebase Auth + localStorage persistence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { ScoredLead } from "@/types/lead.types"
import { auth, db } from "@/lib/firebase/config"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

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
  syncComplete: boolean
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
  const [syncComplete, setSyncComplete] = useState(false)

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
          plan: "FREE",
        }

        // 1. Instantly load from localStorage (Offline-first / Fast load)
        const userKey = `${STORAGE_KEY}_${firebaseUser.uid}`
        let userState = {
          sellerProfile: null,
          savedLeads: [] as SavedLead[],
          onboardingComplete: false,
          plan: "FREE" as "FREE" | "STARTER" | "PRO" | "BUSINESS",
        }
        try {
          const raw = localStorage.getItem(userKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            userState = {
              sellerProfile: parsed.sellerProfile || null,
              savedLeads: parsed.savedLeads || [],
              onboardingComplete: parsed.onboardingComplete || false,
              plan: parsed.plan || "FREE",
            }
          }
        } catch (_) {}

        // Set initial state from local storage first
        setState({
          user: { ...profile, plan: userState.plan },
          isLoggedIn: true,
          sellerProfile: userState.sellerProfile,
          savedLeads: userState.savedLeads,
          onboardingComplete: userState.onboardingComplete,
        })
        setHydrated(true)

        // 2. Background load from Firestore (Cloud-sync / Device sync)
        try {
          const docRef = doc(db, "users", firebaseUser.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const cloudData = docSnap.data()
            setState(prev => {
              const updatedUser = prev.user ? { ...prev.user, plan: cloudData.plan || "FREE" } : null
              return {
                ...prev,
                user: updatedUser,
                sellerProfile: cloudData.sellerProfile || null,
                savedLeads: cloudData.savedLeads || [],
                onboardingComplete: cloudData.onboardingComplete || false,
              }
            })
            // Update local storage cache
            localStorage.setItem(userKey, JSON.stringify({
              sellerProfile: cloudData.sellerProfile || null,
              savedLeads: cloudData.savedLeads || [],
              onboardingComplete: cloudData.onboardingComplete || false,
              plan: cloudData.plan || "FREE",
            }))
          }
        } catch (err) {
          console.warn("[AppContext] Firestore sync-read failed, using offline cache:", err)
        } finally {
          setSyncComplete(true) // Sync load finished (success or fail)
        }

      } else {
        setState(DEFAULT_STATE)
        setSyncComplete(false)
        setHydrated(true)
      }
    })

    return () => unsubscribe()
  }, [])

  // Persist user-specific data to localStorage and Firestore on changes
  useEffect(() => {
    if (!hydrated || !state.isLoggedIn || !state.user?.id) return
    
    const userKey = `${STORAGE_KEY}_${state.user.id}`
    const statePayload = {
      sellerProfile: state.sellerProfile,
      savedLeads: state.savedLeads,
      onboardingComplete: state.onboardingComplete,
      plan: state.user.plan || "FREE",
    }
    
    // Save to local storage
    localStorage.setItem(userKey, JSON.stringify(statePayload))

    // Save to Firestore only AFTER the initial sync read has fully finished
    if (syncComplete) {
      const syncToFirestore = async () => {
        try {
          const docRef = doc(db, "users", state.user!.id)
          await setDoc(docRef, statePayload, { merge: true })
        } catch (err) {
          console.warn("[AppContext] Firestore sync-write failed, using offline fallback:", err)
        }
      }
      syncToFirestore()
    }
  }, [
    state.sellerProfile,
    state.savedLeads,
    state.onboardingComplete,
    state.user?.plan,
    state.isLoggedIn,
    state.user,
    hydrated,
    syncComplete
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
      syncComplete,
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
