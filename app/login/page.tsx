"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error: any) {
      console.error('Firebase email sign-in error', error?.code, error?.message, error);
      setMessage(error.message || "Kirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setMessage(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error: any) {
      console.warn('Popup signin failed, falling back to redirect', error?.code, error?.message);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err: any) {
        console.error('Redirect signin failed', err?.code, err?.message, err);
        setMessage(err.message || "Google bilan kirishda xatolik.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle redirect result (after signInWithRedirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          router.push('/');
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error', err?.code, err?.message, err);
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-[#FAF6F0] px-6 py-12 text-[#2C1A0E]">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-[#D4A853]/15 bg-[#F2E8D9] p-10 shadow-[0_24px_80px_rgba(193,80,23,0.12)]">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#2C1A0E]/70">Kirish</p>
          <h1 className="mt-3 text-4xl font-semibold">Jobify hisobiga kiring</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2C1A0E]/80">Gmail va parol bilan kirish yoki Google hisobingiz orqali davom eting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-[#2C1A0E]/85">
            Gmail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@gmail.com"
              className="mt-3 w-full rounded-3xl border-4 border-[#2C1A0E] bg-[#FAF6F0] px-4 py-4 text-sm text-[#2C1A0E] outline-none focus:ring-0"
            />
          </label>

          <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-[#2C1A0E]/85">
            Parol
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Kamida 6 belgi"
              className="mt-3 w-full rounded-3xl border-4 border-[#2C1A0E] bg-[#FAF6F0] px-4 py-4 text-sm text-[#2C1A0E] outline-none focus:ring-0"
            />
          </label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[180px] items-center justify-center rounded-[14px] bg-[#C1440E] px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#F2E8D9] transition hover:bg-[#a3360a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Iltimos kuting..." : "Kirish"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex min-w-[180px] items-center justify-center rounded-[14px] border border-[#2C1A0E] bg-[#FAF6F0] px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#2C1A0E] transition hover:border-[#D4A853] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Google bilan kirish
            </button>
          </div>

          {message ? <p className="rounded-3xl bg-[#F4E2D0] border border-[#D4A853]/20 px-4 py-4 text-sm font-medium text-[#2C1A0E]">{message}</p> : null}

          <p className="text-sm text-[#2C1A0E]/75">
            Ro'yxatdan o'tmaganmisiz? <a href="/register" className="font-semibold text-[#C1440E] underline">hisob yaratish</a>.
          </p>
        </form>
      </div>
    </main>
  );
}
