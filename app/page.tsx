"use client";

/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { isAdminEmail } from "../lib/admin";
import { UserAvatar } from "../components/UserAvatar";

type TimestampLike = { toDate?: () => Date } | Date | string | number | null | undefined;

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  telegram: string;
  description: string;
  createdAt?: TimestampLike;
  highlighted?: boolean;
};

type JobDocument = Omit<Job, "id">;

const emptyJob: Omit<Job, "id"> = {
  title: "",
  company: "",
  location: "",
  type: "",
  salary: "",
  telegram: "",
  description: "",
};

const platformNotes = [
  {
    title: "Aniq ma'lumot",
    text: "Ish haqi, joylashuv va aloqa bir ko'rishda ko'rinadi.",
  },
  {
    title: "Tezkor saqlash",
    text: "Qiziqqan e'lonni keyinroq ko'rish uchun belgilab qo'yasiz.",
  },
  {
    title: "Ish beruvchi oqimi",
    text: "E'lon qo'shish formasi sodda va tushunarli bo'lib qoladi.",
  },
  {
    title: "Narx",
    text: "Har bir yangi e'lon 20 000 so'm.",
  },
];

function getUserName(user: User | null) {
  return user?.displayName || user?.email?.split("@")[0] || "Profil";
}

function parseJobDocument(id: string, data: Partial<JobDocument>): Job {
  return {
    id,
    title: data.title || "",
    company: data.company || "",
    location: data.location || "",
    type: data.type || "",
    salary: data.salary || "",
    telegram: data.telegram || "",
    description: data.description || "",
    createdAt: data.createdAt ?? null,
    highlighted: Boolean(data.highlighted),
  };
}

function resolveJobDate(job: Job) {
  const value = job.createdAt;

  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && typeof value.toDate === "function") return value.toDate();

  return null;
}

function formatPostedAt(job: Job) {
  const date = resolveJobDate(job);

  if (!date || Number.isNaN(date.getTime())) {
    return "Yangi";
  }

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Bugun";
  if (diffDays === 1) return "Kecha";
  if (diffDays < 7) return `${diffDays} kun oldin`;

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function isFreshJob(job: Job) {
  const date = resolveJobDate(job);
  if (!date || Number.isNaN(date.getTime())) return false;

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays < 7;
}

export default function Home() {
  const [roleQuery, setRoleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [newJob, setNewJob] = useState<Omit<Job, "id">>(emptyJob);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [employerMessage, setEmployerMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        setJobs(
          snapshot.docs.map((jobDoc) =>
            parseJobDocument(jobDoc.id, jobDoc.data() as Partial<JobDocument>),
          ),
        );
      },
      (error) => {
        console.error("Firestore jobs subscription error", error);
        setJobMessage("E'lonlarni yuklashda xatolik yuz berdi.");
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobifySavedJobs");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setSavedJobs(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedJobs([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("jobifySavedJobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const filteredJobs = useMemo(() => {
    const role = roleQuery.trim().toLowerCase();
    const location = locationQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const roleText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      const matchesRole = role ? roleText.includes(role) : true;
      const matchesLocation = location ? job.location.toLowerCase().includes(location) : true;

      return matchesRole && matchesLocation;
    });
  }, [jobs, roleQuery, locationQuery]);

  const savedJobList = useMemo(
    () => jobs.filter((job) => savedJobs.includes(job.id)),
    [jobs, savedJobs],
  );

  const freshJobCount = useMemo(
    () => jobs.filter((job) => isFreshJob(job)).length,
    [jobs],
  );

  const stats = useMemo(
    () => [
      { label: "Faol e'lonlar", value: String(jobs.length) },
      { label: "Saqlangan ishlar", value: String(savedJobList.length) },
      { label: "Yangi joylanganlar", value: String(freshJobCount) },
    ],
    [freshJobCount, jobs.length, savedJobList.length],
  );

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  function openJob(job: Job) {
    setSelectedJob(job);
    window.history.replaceState({}, "", `#${job.id}`);
  }

  function closeJob() {
    setSelectedJob(null);
    window.history.replaceState({}, "", "#");
  }

  function toggleSavedJob(id: string) {
    setSavedJobs((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }

  async function deleteJob(id: string) {
    await deleteDoc(doc(db, "jobs", id));
    setSavedJobs((current) => current.filter((savedId) => savedId !== id));

    if (selectedJob?.id === id) {
      closeJob();
    }
  }

  function submitEmployerRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowEmployerModal(false);
    setEmployerMessage("So'rovingiz qabul qilindi. Jamoamiz tez orada bog'lanadi.");
  }

  async function handleAddJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedJob = {
      title: newJob.title.trim(),
      company: newJob.company.trim(),
      location: newJob.location.trim(),
      type: newJob.type.trim(),
      salary: newJob.salary.trim(),
      telegram: newJob.telegram.trim(),
      description: newJob.description.trim(),
    };

    if (Object.values(trimmedJob).some((value) => !value)) {
      setJobMessage("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        ...trimmedJob,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
      });
      setNewJob(emptyJob);
      setJobMessage("Yangi ish e'loni muvaffaqiyatli qo'shildi.");
    } catch (error) {
      console.error("Firestore add job error", error);
      setJobMessage("E'lonni qo'shishda xatolik yuz berdi.");
    }
  }

  return (
    <div className="jobify-shell px-6 py-8 pb-20">
      <div className="mx-auto max-w-[1400px]">
        <header className="jobify-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[var(--line)] px-8 py-6">
            <nav className="order-2 flex flex-wrap items-center gap-6 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-ink)]">
              <a
                className="transition hover:text-[var(--brand)]"
                href="#jobs"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("jobs");
                }}
              >
                Ishlar
              </a>
              <a
                className="transition hover:text-[var(--brand)]"
                href="#employers"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("employers");
                }}
              >
                Ish beruvchilar
              </a>
              <a
                className="transition hover:text-[var(--brand)]"
                href="#insights"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("insights");
                }}
              >
                Tahlillar
              </a>
            </nav>

            <div className="order-first flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--text-ink)] text-sm font-semibold uppercase text-[#fff6ec]">
                J
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Jobify</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  O'zbek ish platformasi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    aria-label="Profil"
                    title={getUserName(user)}
                    className="inline-flex h-12 w-12 overflow-hidden rounded-full border border-[var(--line)] bg-[rgba(255,250,244,0.88)] p-0.5 transition hover:scale-105"
                    href="/dashboard"
                  >
                    <UserAvatar
                      user={user}
                      alt={getUserName(user)}
                      size={48}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                    }}
                    className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    Chiqish
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    href="/login"
                  >
                    Kirish
                  </Link>
                  <Link
                    className="rounded-full bg-[var(--text-ink)] px-5 py-3 text-sm font-semibold text-[#fff6ec] transition hover:bg-[var(--brand)]"
                    href="/register"
                  >
                    Ro'yxatdan o'tish
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-10 px-8 py-12 lg:grid-cols-[1.25fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="jobify-eyebrow">O'zbekistonda karyera maydoni</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
                Ish e'lonlarini o'zingiz qo'shing, qidiring va tartibli saqlang.
              </h1>
              <p className="jobify-lead mt-8 max-w-xl text-lg">
                Jobify tayyor statik ro'yxat emas. Siz qo'shgan e'lonlar umumiy
                bazada saqlanadi va barcha foydalanuvchilarda bir xil ko'rinadi.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="jobify-chip">Email va Google kirish</span>
                <span className="jobify-chip">Ish beruvchi oqimi</span>
                <span className="jobify-chip">Saqlangan e'lonlar</span>
                <span className="jobify-chip">1 e'lon: 20 000 so'm</span>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => scrollToId("add-job")}
                  className="jobify-btn-primary"
                >
                  E'lon qo'shish
                </button>
                <button
                  onClick={() => scrollToId("jobs")}
                  className="jobify-btn-secondary"
                >
                  Ishlarni ko'rish
                </button>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="jobify-stat">
                    <p className="text-2xl font-semibold text-[var(--text-ink)]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="jobify-panel-soft p-8">
              <p className="jobify-eyebrow">Kengaytirilgan qidiruv</p>
              <div className="mt-6 space-y-5">
                <label className="jobify-label">
                  Lavozim
                  <input
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Dizayner, HR, dasturchi"
                    className="jobify-input"
                  />
                </label>
                <label className="jobify-label">
                  Joylashuv
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Toshkent, Samarqand, masofaviy"
                    className="jobify-input"
                  />
                </label>
                <button
                  onClick={() => scrollToId("jobs")}
                  className="jobify-btn-primary w-full"
                >
                  Qidirish
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-12 grid gap-10 lg:grid-cols-[2.25fr_1fr]">
          <section id="jobs" className="space-y-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="jobify-eyebrow">E'lonlar</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight">
                  Siz qo'shgan ishlar shu yerda ko'rinadi.
                </h2>
              </div>
              <div className="jobify-stat px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-ink)]">
                {filteredJobs.length} ta natija
              </div>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isSaved = savedJobs.includes(job.id);
                const postedAt = formatPostedAt(job);
                const fresh = isFreshJob(job);

                return (
                  <article
                    key={job.id}
                    className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,250,244,0.92)] p-7 shadow-[0_18px_50px_rgba(18,27,36,0.06)] transition duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {job.company}
                          </p>
                          {fresh ? <span className="jobify-tag">Yangi</span> : null}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold">{job.title}</h3>
                      </div>
                      <span className="rounded-full border border-[var(--line)] bg-[rgba(31,111,109,0.08)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                        {job.type}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
                      <span>{job.location}</span>
                      <span>{job.salary}</span>
                      <span>Joylangan: {postedAt}</span>
                    </div>

                    <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                      <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => toggleSavedJob(job.id)}
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        >
                          {isSaved ? "Saqlangan" : "Saqlash"}
                        </button>
                        <button
                          onClick={() => openJob(job)}
                          className="rounded-full bg-[var(--text-ink)] px-4 py-2 text-sm font-semibold text-[#fff6ec] transition hover:bg-[var(--brand)]"
                        >
                          Ko'rish
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="rounded-full border border-[rgba(31,111,109,0.24)] px-4 py-2 text-sm font-semibold text-[var(--brand)]"
                          >
                            O'chirish
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 ? (
                <div className="jobify-panel-soft p-8 text-[var(--text-muted)]">
                  <h3 className="text-xl font-semibold text-[var(--text-ink)]">
                    Hozircha e'lon yo'q
                  </h3>
                  <p className="mt-3 text-sm leading-7">
                    Pastdagi forma orqali birinchi ish e'lonini qo'shing. Qo'shilgan
                    e'lonlar barcha foydalanuvchilarda ko'rinadi.
                  </p>
                  <button
                    onClick={() => scrollToId("add-job")}
                    className="mt-5 jobify-btn-primary"
                  >
                    Birinchi e'lonni qo'shish
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <aside id="insights" className="space-y-8">
            <div className="jobify-panel p-8">
              <p className="jobify-eyebrow">Saqlangan ishlar</p>
              <h3 className="mt-3 text-2xl font-semibold">Keyinroq ko'rish uchun</h3>
              <div className="mt-6 space-y-3">
                {savedJobList.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => openJob(job)}
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-[rgba(255,250,244,0.72)] p-4 text-left transition hover:border-[var(--brand)] hover:bg-[rgba(31,111,109,0.06)]"
                  >
                    <span className="block text-sm font-semibold">{job.title}</span>
                    <span className="mt-1 block text-sm text-[var(--text-muted)]">
                      {job.company}
                    </span>
                  </button>
                ))}
                {savedJobList.length === 0 ? (
                  <p className="text-sm leading-7 text-[var(--text-muted)]">
                    Yoqtirgan e'lonlaringizni saqlab qo'ysangiz, ular shu yerda
                    chiqadi.
                  </p>
                ) : null}
              </div>
            </div>

            <div id="employers" className="jobify-panel p-8">
              <p className="jobify-eyebrow">Ish beruvchi</p>
              <h3 className="mt-4 text-2xl font-semibold">Jamoangiz uchun e'lon joylang</h3>
              <p className="jobify-lead mt-4 text-sm">
                Kompaniya haqida aniq ma'lumot, maosh oralig'i va Telegram kontakt
                qo'shilsa, nomzodlar tezroq murojaat qiladi.
              </p>
              <button
                onClick={() => setShowEmployerModal(true)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]"
              >
                Ish beruvchi kirishini so'rang
              </button>
              {employerMessage ? (
                <p className="mt-4 rounded-[1rem] border border-[var(--line)] bg-[rgba(31,111,109,0.08)] px-4 py-4 text-sm text-[var(--text-ink)]">
                  {employerMessage}
                </p>
              ) : null}
            </div>

            <div className="jobify-panel p-8">
              <p className="jobify-eyebrow">Nega bu joy ishlaydi?</p>
              <div className="mt-6 space-y-4">
                {platformNotes.map((item) => (
                  <div key={item.title} className="rounded-[1rem] border border-[var(--line)] bg-[rgba(255,250,244,0.72)] p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div id="add-job" className="jobify-panel p-8">
              <p className="jobify-eyebrow">Yangi ish qo'shish</p>
              <h3 className="mt-4 text-2xl font-semibold">E'loningizni yarating</h3>
              <div className="mt-4 rounded-[1rem] border border-[var(--line)] bg-[rgba(31,111,109,0.06)] px-4 py-4 text-sm text-[var(--text-muted)]">
                Har bir yangi e'lon uchun to'lov:{" "}
                <span className="font-semibold text-[var(--text-ink)]">20 000 so'm</span>.
                To'lov tasdiqlangach e'lon joylanadi.
              </div>
              <form onSubmit={handleAddJob} className="mt-6 space-y-4">
                <input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="Lavozim nomi"
                  className="jobify-input"
                />
                <input
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  placeholder="Kompaniya nomi"
                  className="jobify-input"
                />
                <input
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  placeholder="Joylashuv"
                  className="jobify-input"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    placeholder="Ish turi"
                    className="jobify-input"
                  />
                  <input
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="Maosh"
                    className="jobify-input"
                  />
                </div>
                <input
                  value={newJob.telegram}
                  onChange={(e) => setNewJob({ ...newJob, telegram: e.target.value })}
                  placeholder="Telegram akkaunt: @username"
                  className="jobify-input"
                />
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Qisqacha ish tavsifi"
                  className="jobify-input jobify-textarea"
                />
                {jobMessage ? (
                  <p className="text-sm text-[var(--brand)]">{jobMessage}</p>
                ) : null}
                <button type="submit" className="jobify-btn-primary w-full">
                  Ish e'lonini qo'shish
                </button>
              </form>
            </div>
          </aside>
        </main>

        {selectedJob ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,20,0.5)] p-6">
            <div className="w-full max-w-xl rounded-[1.75rem] border border-[var(--line)] bg-[rgba(255,250,244,0.98)] p-8 shadow-[0_30px_80px_rgba(18,27,36,0.3)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="jobify-eyebrow">{selectedJob.company}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{selectedJob.title}</h3>
                </div>
                <span className="jobify-tag">{selectedJob.type}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {selectedJob.location} - {selectedJob.salary}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                {selectedJob.description}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  className="jobify-btn-primary"
                  href={`mailto:recruit@${selectedJob.company.replace(/\s+/g, "").toLowerCase()}.uz?subject=${encodeURIComponent(selectedJob.title)}`}
                >
                  Email orqali
                </a>
                <a
                  className="jobify-btn-secondary"
                  href={`https://t.me/${selectedJob.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
                <button onClick={closeJob} className="jobify-btn-secondary">
                  Yopish
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showEmployerModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,20,0.5)] p-6">
            <div className="w-full max-w-lg rounded-[1.75rem] border border-[var(--line)] bg-[rgba(255,250,244,0.98)] p-8 shadow-[0_30px_80px_rgba(18,27,36,0.3)]">
              <h3 className="text-2xl font-semibold">Ish beruvchi kirishini so'rash</h3>
              <p className="jobify-lead mt-2 text-sm">Formani to'ldiring, biz siz bilan bog'lanamiz.</p>
              <form onSubmit={submitEmployerRequest} className="mt-5 space-y-4">
                <input required placeholder="Kompaniya nomi" className="jobify-input" />
                <input required placeholder="Email" type="email" className="jobify-input" />
                <textarea placeholder="Qisqacha ma'lumot" className="jobify-input jobify-textarea" />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmployerModal(false)}
                    className="jobify-btn-secondary"
                  >
                    Bekor qilish
                  </button>
                  <button type="submit" className="jobify-btn-primary">
                    Yuborish
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
