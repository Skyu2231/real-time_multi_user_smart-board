"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      alert(`Login failed: ${error.message}`);
      return;
    }

    router.push("/");
  }

  return (
    <main
      style={{
            minHeight: "100vh",
            padding: "40px",
            backgroundColor: "#f5f5f5",
            color: "#111",
        }}
    >
      <h1>Teacher Login</h1>

      <div
        style={{
          maxWidth: "400px",
          marginTop: "20px",
        }}
      >
        <div>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            style={{
                display: "block",
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                backgroundColor: "white",
                color: "black",
                border: "1px solid #ccc",
                borderRadius: "6px",
            }}
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            style={{
                display: "block",
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                backgroundColor: "white",
                color: "black",
                border: "1px solid #ccc",
                borderRadius: "6px",
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
                padding: "10px 16px",
                cursor: loading ? "default" : "pointer",
                backgroundColor: "#111",
                color: "white",
                border: "none",
                borderRadius: "6px",
            }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </main>
  );
}