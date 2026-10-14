import { useCallback, useEffect, useState } from "react";
import api, { TOKEN_KEY } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)),);
  const [sessionError, setSessionError] = useState("");

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSessionError("");
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setSessionError("");

    if (!sessionStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data);
    } catch (error) {
      setUser(null);

      if ([401, 403].includes(error.response?.status)) {
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        setSessionError(
          "We couldn't verify your session. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  let active = true;
  const controller = new AbortController();

  async function initializeSession() {
    try {
      const { data } = await api.get("/api/auth/me", {
        signal: controller.signal,
      });

      if (active) {
        setUser(data);
        setSessionError("");
      }
    } catch (error) {
      if (!active) return;

      setUser(null);

      if ([401, 403].includes(error.response?.status)) {
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        setSessionError(
          "We couldn't verify your session. Please try again.",
        );
      }
    } finally {
      if (active) setLoading(false);
    }
  }

  const handleExpired = () => logout();

  window.addEventListener(
    "stylehub:session-expired",
    handleExpired,
  );

  if (sessionStorage.getItem(TOKEN_KEY)) {
    initializeSession();
  }

  return () => {
    active = false;
    controller.abort();
    window.removeEventListener(
      "stylehub:session-expired",
      handleExpired,
    );
  };
}, [logout]);

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", {
      email,
      password,
    });

    sessionStorage.setItem(TOKEN_KEY, data.access_token);

    try {
      const response = await api.get("/api/auth/me");
      setUser(response.data);
      setSessionError("");
      return response.data;
    } catch (error) {
      logout();
      throw error;
    }
  }

  async function register(name, email, password) {
    await api.post("/api/auth/register", {
      name,
      email,
      password,
    });

    return login(email, password);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}