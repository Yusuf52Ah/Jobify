"use client";

/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "../../components/UserAvatar";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  if (!user) return <p className="p-8">Yuklanmoqda...</p>;

  return (
    <main className="min-h-screen bg-[#FAF6F0] px-6 py-12 text-[#2C1A0E]">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-[#D4A853]/15 bg-[#F2E8D9] p-10 shadow-[0_24px_80px_rgba(193,80,23,0.12)]">
        <div className="flex flex-wrap items-center gap-5">
          <UserAvatar
            user={user}
            alt={user.displayName || user.email || "Profil"}
            size={80}
            className="h-20 w-20 rounded-full border-2 border-[#D4A853] bg-[#FAF6F0] object-cover p-1"
          />
          <div>
            <p className="text-sm uppercase text-[#2C1A0E]/65">Profil</p>
            <h1 className="mt-2 text-3xl font-semibold">{user.displayName || user.email}</h1>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-[#2C1A0E]/75">
          Xush kelibsiz. Bosh sahifada ish e'lonlarini qo'shish, saqlash va qidirish mumkin.
        </p>
        <div className="mt-6 flex gap-4">
          <button onClick={handleSignOut} className="rounded-[12px] bg-[#C1440E] px-6 py-3 text-sm font-semibold text-[#F2E8D9]">Chiqish</button>
          <Link href="/" className="rounded-[12px] border border-[#2C1A0E] px-6 py-3 text-sm font-semibold">Bosh sahifa</Link>
        </div>
      </div>
    </main>
  );
}
