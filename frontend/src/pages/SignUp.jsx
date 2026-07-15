import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { apiGet, apiPost, extractErrorMessage, extractFieldErrors } from "../lib/api";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldError({ errors, field }) {
  const message = errors?.[field]?.[0];
  if (!message) return null;
  return <p className="mt-1 px-1 text-xs text-red-500">{message}</p>;
}

export default function SignUp() {
  const [mode, setMode] = useState("customer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [businessTypeId, setBusinessTypeId] = useState("");
  const [businessTypes, setBusinessTypes] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("business-types", { signal: controller.signal })
      .then(setBusinessTypes)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!slugTouched) setBusinessSlug(slugify(businessName));
  }, [businessName, slugTouched]);

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "customer") {
        const user = await apiPost("register", {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
        setSuccess({ type: "customer", name: user.name });
      } else {
        const data = await apiPost("store-signup", {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          business_name: businessName,
          business_slug: businessSlug,
          business_type_id: businessTypeId,
        });
        setSuccess({ type: "store", businessName: data.tenant.name });
      }
    } catch (error) {
      const errors = extractFieldErrors(error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        setGeneralError(extractErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {success.type === "customer" ? "You're all set" : "Application submitted"}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {success.type === "customer"
              ? `Welcome, ${success.name}. Your account is ready.`
              : `Thanks! "${success.businessName}" is pending admin approval — we'll be in touch once it's live.`}
          </p>
          <Link
            to="/login"
            className="mt-8 inline-block w-full rounded-full bg-[#f5a623] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e6981a]"
          >
            Continue
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-gray-400">Let's get you started.</p>

      <div className="mt-6 flex rounded-full bg-gray-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("customer")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "customer" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Customer
        </button>
        <button
          type="button"
          onClick={() => setMode("store")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "store" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Open a store
        </button>
      </div>

      {mode === "store" && (
        <p className="mt-3 text-xs text-gray-400">
          Store applications are reviewed by an admin before your store goes live.
        </p>
      )}

      {generalError && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{generalError}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
          />
          <FieldError errors={fieldErrors} field="email" />
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError errors={fieldErrors} field="password" />
        </div>

        <div>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
          />
          <FieldError errors={fieldErrors} field="password_confirmation" />
        </div>

        {mode === "store" && (
          <>
            <div className="pt-2">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
              />
              <FieldError errors={fieldErrors} field="business_name" />
            </div>

            <div>
              <input
                type="text"
                value={businessSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setBusinessSlug(slugify(e.target.value));
                }}
                placeholder="business-slug"
                className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
              />
              <p className="mt-1 px-1 text-xs text-gray-400">Used in your store's URL.</p>
              <FieldError errors={fieldErrors} field="business_slug" />
            </div>

            <div>
              <select
                value={businessTypeId}
                onChange={(e) => setBusinessTypeId(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                <option value="" disabled>
                  Business type
                </option>
                {businessTypes.map((businessType) => (
                  <option key={businessType.id} value={businessType.id}>
                    {businessType.name}
                  </option>
                ))}
              </select>
              <FieldError errors={fieldErrors} field="business_type_id" />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#f5a623] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e6981a] disabled:opacity-60"
        >
          {submitting
            ? "Please wait…"
            : mode === "customer"
              ? "Create Account"
              : "Submit Application"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-gray-900 hover:underline">
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}