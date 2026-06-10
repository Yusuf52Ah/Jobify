"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";

const benefits = [
  {
    title: "Aniq profil",
    text: "Nomzod nomi, emaili va hisob turi birinchi bosqichdayoq tartibga tushadi.",
  },
  {
    title: "Tezkor kirish",
    text: "Google orqali bir necha soniyada davom etish mumkin, mobil foydalanuvchi uchun qulay.",
  },
  {
    title: "Saqlangan ishlar",
    text: "Qiziqqan e'lonlarni saqlab, keyin qaytib ko'rish oson bo'ladi.",
  },
];

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
      await updateProfile(userCredential.user, { displayName: name.trim() });
      router.replace("/login?registered=1");
    } catch (error: any) {
      console.error("Firebase register error", error?.code, error?.message, error);
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
        if (result) router.replace("/");
      })
      .catch((err) => console.error("getRedirectResult error", err));
  }, [router]);

  return (
    <main className="jobify-shell px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <section className="jobify-panel p-8 sm:p-10">
          <p className="jobify-eyebrow">Hisob yaratish</p>
          <p className="mt-3 text-sm font-medium text-[var(--text-muted)]">
            5 yillik HR tajribasi bilan shakllangan, sodda va ishonchli ro'yxatdan o'tish oqimi.
          </p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
            Jobify'da ish izlashni tartibli va ishonchli boshlang.
          </h1>
          <p className="jobify-lead mt-5 max-w-2xl text-base">
            Email, parol va ism bilan ro'yxatdan o'tasiz. Keyin saqlangan e'lonlar,
            qidiruvlar va kontaktlar bir joyda qoladi.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="jobify-stat">
              <p className="text-lg font-semibold">Email</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Oddiy va tez kirish.</p>
            </div>
            <div className="jobify-stat">
              <p className="text-lg font-semibold">Google</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Bir klikda davom etish.</p>
            </div>
            <div className="jobify-stat">
              <p className="text-lg font-semibold">Profil</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Nomzod ma'lumoti tartibli.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="jobify-label">
              To'liq ism
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Masalan, Azamat Karimov"
                className="jobify-input"
                disabled={loading}
              />
            </label>

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
                minLength={6}
                autoComplete="new-password"
                placeholder="Kamida 6 belgi"
                className="jobify-input"
                disabled={loading}
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button type="submit" disabled={loading} className="jobify-btn-primary min-w-[190px]">
                {loading ? "Iltimos kuting..." : "Hisob yaratish"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="jobify-btn-secondary min-w-[190px]"
              >
                Google bilan davom etish
              </button>
            </div>

            {message ? (
              <p className="rounded-[1.25rem] border border-[var(--line)] bg-[rgba(31,111,109,0.08)] px-4 py-4 text-sm font-medium text-[var(--text-ink)]">
                {message}
              </p>
            ) : null}

            <p className="text-sm text-[var(--text-muted)]">
              Hisobingiz bor bo'lsa,{" "}
              <Link href="/login" className="font-semibold text-[var(--brand)] underline underline-offset-4">
                kirish sahifasi
              </Link>{" "}
              orqali davom eting.
            </p>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="jobify-panel p-8">
            <p className="jobify-eyebrow">Nima uchun Jobify?</p>
            <h2 className="mt-4 text-3xl leading-tight">
              Tabiiy ko'rinadigan, tartibli va ish jarayoniga mos platforma.
            </h2>
            <p className="jobify-lead mt-4">
              Dizayn ortiqcha shovqinsiz, ammo yetarlicha ishonchli. HR va nomzod
              uchun ma'lumotlar birinchi ko'rishda tushunarli bo'ladi.
            </p>
          </div>

          <div className="space-y-3">
            {benefits.map((item) => (
              <article key={item.title} className="jobify-panel-soft p-6">
                <p className="jobify-tag">{item.title}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="jobify-panel p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Ishga moslik
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="jobify-chip">Sodda ro'yxatdan o'tish</span>
              <span className="jobify-chip">Mobilga mos</span>
              <span className="jobify-chip">Ishonchli flow</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
