"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("support@icancall.co");
  const [password, setPassword] = useState("••••••••");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard automatically
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isAdminLoggedIn") === "true") {
        window.location.href = "/super-admin";
      } else if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data.role === "admin") {
        localStorage.setItem("isAdminLoggedIn", "true");
        window.location.href = "/super-admin";
      } else {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "support@icancall.co", password: "google_oauth_bypass" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Google sign-in failed.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", "support@icancall.co");
      window.location.href = "/dashboard";
    } catch (err) {
      setError("An unexpected error occurred during Google sign-in.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "oklch(0.975 0.008 220)",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid oklch(0.905 0.012 225)",
          borderRadius: 18,
          boxShadow: "0 10px 25px oklch(0.4 0.05 240 / 0.08)",
          padding: "36px 30px",
        }}
      >
        {/* Brand */}
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <svg
            id="logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 553.0305"
            style={{ height: "64px", width: "auto", display: "block", margin: "0 auto 16px auto" }}
          >
            <defs>
              <style>{`
                #logo .cls-1 { fill: #1c2530; }
                #logo .cls-2 { fill: #4083ae; }
                #logo .cls-3 { fill: #fff; }
              `}</style>
            </defs>
            <g>
              <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
              <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
            </g>
            <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
          </svg>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "oklch(0.26 0.028 248)" }}>
            Sign in to iCanCall
          </h1>
          <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.018 242)", marginTop: 6, margin: 0 }}>
            Enter your credentials to access your routing dashboard
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              background: "oklch(0.96 0.05 22 / 0.1)",
              border: "1px solid oklch(0.96 0.05 22 / 0.2)",
              color: "oklch(0.5 0.18 22)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: "0.82rem",
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.46 0.022 245)" }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 13px",
                fontSize: "0.94rem",
                borderRadius: 8,
                border: "1px solid oklch(0.905 0.012 225)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.46 0.022 245)" }}>Password</label>
              <a href="#" style={{ fontSize: "0.78rem", color: "oklch(0.58 0.115 232)", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 13px",
                fontSize: "0.94rem",
                borderRadius: 8,
                border: "1px solid oklch(0.905 0.012 225)",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: "oklch(0.58 0.115 232)",
              color: "#ffffff",
              cursor: "pointer",
              marginTop: 6,
              boxShadow: "0 4px 10px oklch(0.58 0.115 232 / 0.2)",
              transition: "background 0.15s",
            }}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "oklch(0.60 0.018 242)" }}>
          <div style={{ flex: 1, height: 1, background: "oklch(0.905 0.012 225)" }} />
          <span style={{ padding: "0 10px", fontSize: "0.78rem", fontWeight: 500 }}>or sign in with</span>
          <div style={{ flex: 1, height: 1, background: "oklch(0.905 0.012 225)" }} />
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "11px",
            fontSize: "0.9rem",
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid oklch(0.905 0.012 225)",
            background: "#ffffff",
            color: "oklch(0.26 0.028 248)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 2px 4px oklch(0.4 0.05 240 / 0.02)",
            transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <div style={{
          marginTop: 24,
          padding: "12px 14px",
          borderRadius: 10,
          background: "oklch(0.98 0.005 220)",
          border: "1px dashed oklch(0.85 0.01 220)",
          fontSize: "0.8rem",
          lineHeight: "1.4",
          color: "oklch(0.4 0.01 220)"
        }}>
          <strong>Demo Accounts (Click to auto-fill):</strong>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div 
              style={{ cursor: "pointer", display: "inline-block", color: "oklch(0.4 0.01 220)" }} 
              onClick={() => { setEmail("support@icancall.co"); setPassword("••••••••"); }}
              onMouseEnter={(e) => e.currentTarget.style.color = "oklch(0.58 0.115 232)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "oklch(0.4 0.01 220)"}
            >
              • Customer: <code>support@icancall.co</code>
            </div>
            <div 
              style={{ cursor: "pointer", display: "inline-block", color: "oklch(0.4 0.01 220)" }} 
              onClick={() => { setEmail("admin@icancall.co"); setPassword("••••••••"); }}
              onMouseEnter={(e) => e.currentTarget.style.color = "oklch(0.58 0.115 232)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "oklch(0.4 0.01 220)"}
            >
              • Super Admin: <code>admin@icancall.co</code>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: "0.84rem", color: "oklch(0.46 0.022 245)" }}>
          Don't have an account?{" "}
          <Link href="/onboarding" style={{ color: "oklch(0.58 0.115 232)", textDecoration: "none", fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
