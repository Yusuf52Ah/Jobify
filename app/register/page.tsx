"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setMessage("Ro'yxatdan muvaffaqiyatli o'tdingiz. Iltimos kirish qiling.");
      router.push("/login");
    } catch (error: any) {
      console.error('Firebase register error', error?.code, error?.message, error);
      setMessage(error.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
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

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) router.push('/');
      })
      .catch((err) => console.error('getRedirectResult error', err));
  }, [router]);

  return (
    <main className="min-h-screen bg-[#FAF6F0] px-6 py-12 text-[#2C1A0E]">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-[#D4A853]/15 bg-[#F2E8D9] p-10 shadow-[0_24px_80px_rgba(193,80,23,0.12)]">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#2C1A0E]/70">Hisob yaratish</p>
          <h1 className="mt-3 text-4xl font-semibold">Jobify-ga ro'yxatdan o'ting</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2C1A0E]/80">Gmail (email), parol va ism orqali ro'yxatdan o'tish. Keyin ish platformasiga kirish mumkin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-[#2C1A0E]/85">
            Ism
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="To'liq ism"
              className="mt-3 w-full rounded-3xl border-4 border-[#2C1A0E] bg-[#FAF6F0] px-4 py-4 text-sm text-[#2C1A0E] outline-none focus:ring-0"
            />
          </label>

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
              {loading ? "Iltimos kuting..." : "Ro'yxatdan o'tish"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex min-w-[180px] items-center justify-center rounded-[14px] border border-[#2C1A0E] bg-[#FAF6F0] px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#2C1A0E] transition hover:border-[#D4A853] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Google bilan davom etish
            </button>
          </div>

          {message ? <p className="rounded-3xl bg-[#F4E2D0] border border-[#D4A853]/20 px-4 py-4 text-sm font-medium text-[#2C1A0E]">{message}</p> : null}

          <p className="text-sm text-[#2C1A0E]/75">
            Agar hisobingiz bo'lsa, <a href="/login" className="font-semibold text-[#C1440E] underline">kirish</a> sahifasiga o'ting.
          </p>
        </form>
      </div>
    </main>
  );
}
