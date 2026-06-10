"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, googleProvider } from "../../lib/firebase";
import {
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

const loginBenefits = [
  {
    title: "Tezroq kirish",
    text: "Hisobingiz bo'lsa, bir necha soniyada ish qidirishni davom ettirasiz.",
  },
  {
    title: "Saqlangan e'lonlar",
    text: "Oldin belgilagan vakansiyalar va qidiruvlar joyida qoladi.",
  },
  {
    title: "Ishonchli oqim",
    text: "Email yoki Google orqali aniq va tushunarli kirish jarayoni.",
  },
];

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredMessage =
    searchParams.get("registered") === "1"
      ? "Hisob yaratildi. Endi email va parol bilan kirishingiz mumkin."
      : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(registeredMessage);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (error: any) {
      console.error("Firebase email sign-in error", error?.code, error?.message, error);
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
      router.replace("/");
    } catch (error: any) {
      console.warn("Popup signin failed, falling back to redirect", error?.code, error?.message);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err: any) {
        console.error("Redirect signin failed", err?.code, err?.message, err);
        setMessage(err.message || "Google bilan kirishda xatolik.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          router.replace("/");
        }
      })
      .catch((err) => {
        console.error("getRedirectResult error", err?.code, err?.message, err);
      });
  }, [router]);

  return (
    <main className="jobify-shell px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <aside className="space-y-6">
          <div className="jobify-panel p-8">
            <p className="jobify-eyebrow">Kirish</p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Hisobingizga kiring va qidiruvni davom ettiring.
            </h1>
            <p className="jobify-lead mt-5">
              Email va parol bilan yoki Google orqali davom eting. Interfeys
              sodda, lekin professional oqimda ishlaydi.
            </p>
          </div>

          <div className="space-y-3">
            {loginBenefits.map((item) => (
              <article key={item.title} className="jobify-panel-soft p-6">
                <p className="jobify-tag">{item.title}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </aside>

        <section className="jobify-panel p-8 sm:p-10">
          <div className="mb-8">
            <p className="jobify-eyebrow">Jobify hisob</p>
            <p className="mt-3 text-sm font-medium text-[var(--text-muted)]">
              5 yillik HR tajribasi bilan moslangan, aniq va ishonchli kirish oqimi.
            </p>
            <h2 className="mt-4 text-3xl leading-tight sm:text-4xl">
              Qisqa, aniq va ortiqcha bezaksiz kirish.
            </h2>
            <p className="jobify-lead mt-4 max-w-2xl text-base">
              Hisobingizga kirgach, saqlangan e'lonlar va qidiruvlarni bir joyda
              ushlab turasiz.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="jobify-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@gmail.com"
                className="jobify-input"
                disabled={loading}
              />
            </label>

            <label className="jobify-label">
              Parol
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Kamida 6 belgi"
                className="jobify-input"
                disabled={loading}
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button type="submit" disabled={loading} className="jobify-btn-primary min-w-[190px]">
                {loading ? "Iltimos kuting..." : "Kirish"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="jobify-btn-secondary min-w-[190px]"
              >
                Google bilan kirish
              </button>
            </div>

            {message ? (
              <p className="rounded-[1.25rem] border border-[var(--line)] bg-[rgba(31,111,109,0.08)] px-4 py-4 text-sm font-medium text-[var(--text-ink)]">
                {message}
              </p>
            ) : null}

            <p className="text-sm text-[var(--text-muted)]">
              Ro'yxatdan o'tmaganmisiz?{" "}
              <Link href="/register" className="font-semibold text-[var(--brand)] underline underline-offset-4">
                hisob yaratish
              </Link>{" "}
              sahifasiga o'ting.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
