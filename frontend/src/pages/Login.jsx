import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-gray-400">Please enter your details.</p>

      <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-4">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full border border-gray-200 px-5 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
          <label className="flex items-center gap-2 text-gray-500">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-400 focus:ring-orange-300"
            />
            Remember me
          </label>
          <a href="#" className="font-medium text-gray-500 hover:text-gray-700">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-[#f5a623] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e6981a]"
        >
          Log In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-gray-900 hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}