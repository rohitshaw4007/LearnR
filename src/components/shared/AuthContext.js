"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Check User Session (Updated Logic)
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Step A: Local Storage Check (Fast UI Response)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Step B: Verify with Server (Reliable Source)
        // यह जरूरी है: अगर localStorage खाली है लेकिन cookie है, तो यह user को restore करेगा
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user)); // Sync LocalStorage
        } else {
          // अगर सर्वर कहे कि टोकन नहीं है, तो सब साफ़ कर दो
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // 2. Login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // 3. Logout (Fixed: Calls API now)
  const logout = async () => {
    try {
      // Server-side cookie delete karein
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API Error:", error);
    }

    // Client-side cleanup
    setUser(null);
    localStorage.removeItem("user");
    
    // Redirect aur Refresh (Middleware ko naye status ka pata chalne ke liye)
    router.push("/login");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};