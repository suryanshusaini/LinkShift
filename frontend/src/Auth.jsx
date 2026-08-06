import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

export default function Auth({ mode, setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const body =
        mode === "login"
          ? { email, password }
          : { name: name.trim(), email, password };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name || "");

      setUser({ email: data.email, name: data.name || "" });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google sign-in failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name || "");

      setUser({ email: data.email, name: data.name || "" });
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* LinkShift logo mark */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h2>

      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white py-3 rounded-lg font-medium transition-all duration-300 ease-in-out disabled:bg-blue-300 shadow-sm"
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Sign-In */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google sign-in failed")}
            theme="outline"
            shape="rectangular"
            size="large"
            text={mode === "login" ? "signin_with" : "signup_with"}
            width="368"
          />
        </div>

        {mode === "login" && (
          <div className="text-center mb-8">
            <button className="text-sm text-slate-400 hover:text-slate-600 transition-all duration-300">
              Forgot your password?
            </button>
          </div>
        )}

        <div className="text-center border-t border-slate-200 pt-8">
          <p className="text-slate-500 mb-4">
            {mode === "login"
              ? "Don't have a LinkShift account?"
              : "Already have an account?"}
          </p>
          <Link
            to={mode === "login" ? "/signup" : "/login"}
            className="block w-full py-3 px-4 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-all duration-300"
          >
            {mode === "login"
              ? "Create new account"
              : "Sign in to existing account"}
          </Link>
        </div>
      </div>
    </div>
  );
}

