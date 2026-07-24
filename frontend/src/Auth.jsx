import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Auth({ mode, setUser }) {
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
      const response = await fetch(
        `http://localhost:8000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);

      setUser({ email: data.email });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Abstract Logo matching the screenshot vibe */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg">
          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full transform -rotate-12"></div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-550 hover:bg-blue-600 bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors disabled:bg-blue-300 shadow-sm"
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        {mode === "login" && (
          <div className="text-center mb-8">
            <button className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
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
            className="block w-full py-3 px-4 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
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
