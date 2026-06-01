"use client";

/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

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
import { UserAvatar } from "../components/UserAvatar";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  telegram: string;
  description: string;
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
  };
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
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
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

  const stats = useMemo(
    () => [
      { label: "Faol e'lonlar", value: String(jobs.length) },
      { label: "Saqlangan ishlar", value: String(savedJobList.length) },
      { label: "Qidiruv natijasi", value: String(filteredJobs.length) },
    ],
    [filteredJobs.length, jobs.length, savedJobList.length],
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
    if (selectedJob?.id === id) closeJob();
  }

  function submitEmployerRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowEmployerModal(false);
    alert("So'rovingiz qabul qilindi. Tez orada bog'lanamiz.");
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
      setJobMessage("Yangi ish e'loni hammaga qo'shildi.");
    } catch (error) {
      console.error("Firestore add job error", error);
      setJobMessage("E'lonni qo'shishda xatolik yuz berdi.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2C1A0E]">
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-8">
        <header className="relative overflow-hidden rounded-[24px] border border-[#D4A853]/15 bg-[#F2E8D9] shadow-[0_20px_70px_rgba(193,80,23,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[#2C1A0E]/10 px-8 py-6">
            <nav className="order-2 flex flex-wrap items-center gap-6 text-sm font-medium uppercase text-[#2C1A0E]">
              <a className="relative hover:text-[#C1440E]" href="#jobs" onClick={(e) => { e.preventDefault(); scrollToId("jobs"); }}>
                Ishlar
                <span className="absolute -bottom-2 left-0 h-0.5 w-8 bg-[#D4A853]" />
              </a>
              <a className="hover:text-[#C1440E]" href="#employers" onClick={(e) => { e.preventDefault(); scrollToId("employers"); }}>
                Ish beruvchilar
              </a>
              <a className="hover:text-[#C1440E]" href="#insights" onClick={(e) => { e.preventDefault(); scrollToId("insights"); }}>
                Tahlillar
              </a>
            </nav>

            <div className="order-first flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#2C1A0E] text-sm font-semibold uppercase text-[#F2E8D9]">J</span>
              <div>
                <p className="text-sm uppercase text-[#2C1A0E]/80">Jobify</p>
                <p className="text-xs uppercase text-[#2C1A0E]/50">O'zbek ish platformasi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <a
                    aria-label="Profil"
                    title={getUserName(user)}
                    className="inline-flex h-12 w-12 overflow-hidden rounded-full border-2 border-[#D4A853] bg-[#FAF6F0] p-0.5 transition hover:scale-105"
                    href="/dashboard"
                  >
                    <UserAvatar
                      user={user}
                      alt={getUserName(user)}
                      size={48}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </a>
                  <button
                    onClick={async () => { await signOut(auth); }}
                    className="rounded-full border border-[#2C1A0E]/20 px-5 py-3 text-sm font-semibold transition hover:border-[#C1440E] hover:text-[#C1440E]"
                  >
                    Chiqish
                  </button>
                </>
              ) : (
                <>
                  <a className="rounded-full border border-[#2C1A0E]/20 px-5 py-3 text-sm font-semibold transition hover:border-[#C1440E] hover:text-[#C1440E]" href="/login">Kirish</a>
                  <a className="rounded-full bg-[#2C1A0E] px-5 py-3 text-sm font-semibold text-[#F2E8D9] transition hover:bg-[#C1440E]" href="/register">Ro'yxatdan o'tish</a>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-12 px-8 py-12 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm uppercase text-[#2C1A0E]/70">O'zbekistonda karyera maydoni</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[#2C1A0E] sm:text-6xl">
                Ish e'lonlarini o'zingiz qo'shing, qidiring va saqlab boring.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#2C1A0E]/80">
                Jobify endi tayyor statik ro'yxatga bog'lanmaydi. Siz qo'shgan e'lonlar umumiy bazada saqlanadi va hammada bir xil ko'rinadi.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button onClick={() => scrollToId("add-job")} className="inline-flex items-center justify-center rounded-[12px] bg-[#C1440E] px-8 py-4 text-sm font-semibold uppercase text-[#F2E8D9] transition hover:bg-[#a3360a]">
                  E'lon qo'shish
                </button>
                <button onClick={() => scrollToId("jobs")} className="inline-flex items-center justify-center rounded-[12px] border border-[#2C1A0E] px-8 py-4 text-sm font-semibold uppercase text-[#2C1A0E] transition hover:border-[#C1440E] hover:text-[#C1440E]">
                  Ishlarni ko'rish
                </button>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[16px] border border-[#2C1A0E]/10 bg-[#F7EFE4] px-5 py-6">
                    <p className="text-2xl font-semibold text-[#2C1A0E]">{stat.value}</p>
                    <p className="mt-2 text-sm uppercase text-[#2C1A0E]/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-[#2C1A0E]/10 bg-[#FAF6F0] p-8 shadow-[var(--shadow-warm)]">
              <p className="mb-6 text-sm uppercase text-[#2C1A0E]/70">Kengaytirilgan qidiruv</p>
              <div className="space-y-6">
                <label className="block text-sm font-semibold uppercase text-[#2C1A0E]/85">
                  Lavozim
                  <input value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} placeholder="Dizayner, HR, dasturchi" className="mt-3 w-full border-4 border-[#2C1A0E] bg-[#FAF6F0] px-4 py-4 text-sm text-[#2C1A0E] outline-none" />
                </label>
                <label className="block text-sm font-semibold uppercase text-[#2C1A0E]/85">
                  Joylashuv
                  <input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Toshkent, Samarqand, masofaviy" className="mt-3 w-full border-4 border-[#2C1A0E] bg-[#FAF6F0] px-4 py-4 text-sm text-[#2C1A0E] outline-none" />
                </label>
                <button onClick={() => scrollToId("jobs")} className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#C1440E] px-6 py-4 text-sm font-semibold uppercase text-[#F2E8D9]">
                  Qidirish
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-12 grid gap-10 lg:grid-cols-[2.3fr_1fr]">
          <section id="jobs" className="space-y-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm uppercase text-[#2C1A0E]/70">E'lonlar</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#2C1A0E]">Siz qo'shgan ishlar shu yerda chiqadi.</h2>
              </div>
              <div className="rounded-[14px] border border-[#D4A853]/20 bg-[#F7EFE4] px-4 py-3 text-sm font-medium uppercase text-[#2C1A0E]/85">
                {filteredJobs.length} ta natija
              </div>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isSaved = savedJobs.includes(job.id);

                return (
                  <article key={job.id} className="group overflow-hidden rounded-[20px] border-l-4 border-[#D4A853] bg-[#F2E8D9] p-8 shadow-[0_20px_50px_rgba(44,26,14,0.08)] transition duration-300 hover:-translate-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase text-[#2C1A0E]/60">{job.company}</p>
                        <h3 className="mt-3 text-2xl font-semibold text-[#2C1A0E]">{job.title}</h3>
                      </div>
                      <span className="rounded-[12px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-2 text-sm font-semibold uppercase text-[#2C1A0E]/85">{job.type}</span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#2C1A0E]/70">
                      <span>{job.location}</span>
                      <span>{job.salary}</span>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                      <p className="max-w-xl text-sm text-[#2C1A0E]/70">{job.description}</p>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => toggleSavedJob(job.id)} className="rounded-md border border-[#2C1A0E]/20 px-4 py-2 text-sm font-semibold text-[#2C1A0E] hover:border-[#C1440E] hover:text-[#C1440E]">
                          {isSaved ? "Saqlangan" : "Saqlash"}
                        </button>
                        <button onClick={() => openJob(job)} className="rounded-md bg-[#C1440E] px-4 py-2 text-sm font-semibold text-[#F2E8D9]">
                          Ko'rish
                        </button>
                        <button onClick={() => deleteJob(job.id)} className="rounded-md border border-[#C1440E]/30 px-4 py-2 text-sm font-semibold text-[#C1440E]">
                          O'chirish
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="rounded-[18px] border border-[#2C1A0E]/10 bg-[#F7EFE4] p-8 text-[#2C1A0E]/75">
                  <h3 className="text-xl font-semibold text-[#2C1A0E]">Hozircha e'lon yo'q</h3>
                  <p className="mt-3 text-sm leading-6">Pastdagi forma orqali birinchi ish e'lonini qo'shing. Qo'shilgan e'lonlar barcha foydalanuvchilarda ko'rinadi.</p>
                  <button onClick={() => scrollToId("add-job")} className="mt-5 rounded-[12px] bg-[#2C1A0E] px-5 py-3 text-sm font-semibold text-[#F2E8D9]">
                    Birinchi e'lonni qo'shish
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside id="insights" className="space-y-8">
            <div className="rounded-[24px] border border-[#D4A853]/15 bg-[#F7EFE4] p-8 shadow-[var(--shadow-warm)]">
              <p className="text-sm uppercase text-[#2C1A0E]/70">Saqlangan ishlar</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#2C1A0E]">Keyinroq ko'rish uchun</h3>
              <div className="mt-6 space-y-3">
                {savedJobList.map((job) => (
                  <button key={job.id} onClick={() => openJob(job)} className="w-full rounded-[14px] bg-[#F2E8D9] p-4 text-left transition hover:bg-[#FAF6F0]">
                    <span className="block text-sm font-semibold text-[#2C1A0E]">{job.title}</span>
                    <span className="mt-1 block text-sm text-[#2C1A0E]/70">{job.company}</span>
                  </button>
                ))}
                {savedJobList.length === 0 && <p className="text-sm leading-6 text-[#2C1A0E]/70">Yoqtirgan e'lonlaringizni saqlab qo'ysangiz, ular shu yerda chiqadi.</p>}
              </div>
            </div>

            <div id="employers" className="rounded-[24px] border border-[#2C1A0E]/10 bg-[#F2E8D9] p-8 shadow-[0_18px_50px_rgba(44,26,14,0.08)]">
              <p className="text-sm uppercase text-[#2C1A0E]/70">Ish beruvchi</p>
              <h3 className="mt-4 text-2xl font-semibold text-[#2C1A0E]">Jamoangiz uchun e'lon joylang</h3>
              <p className="mt-4 text-sm leading-6 text-[#2C1A0E]/75">Kompaniya haqida aniq ma'lumot, maosh oralig'i va Telegram kontakt qo'shilsa, nomzodlar tezroq murojaat qiladi.</p>
              <button onClick={() => setShowEmployerModal(true)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase text-[#C1440E]">
                Ish beruvchi kirishini so'rang
              </button>
            </div>

            <div id="add-job" className="rounded-[24px] border border-[#2C1A0E]/10 bg-[#F7EFE4] p-8 shadow-[var(--shadow-warm)]">
              <p className="text-sm uppercase text-[#2C1A0E]/70">Yangi ish qo'shish</p>
              <h3 className="mt-4 text-2xl font-semibold text-[#2C1A0E]">E'loningizni yarating</h3>
              <form onSubmit={handleAddJob} className="mt-6 space-y-4">
                <input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="Lavozim nomi" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                <input value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} placeholder="Kompaniya nomi" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                <input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="Joylashuv" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input value={newJob.type} onChange={(e) => setNewJob({ ...newJob, type: e.target.value })} placeholder="Ish turi" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                  <input value={newJob.salary} onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })} placeholder="Maosh" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                </div>
                <input value={newJob.telegram} onChange={(e) => setNewJob({ ...newJob, telegram: e.target.value })} placeholder="Telegram akkaunt: @username" className="w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                <textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="Qisqacha ish tavsifi" className="min-h-[120px] w-full rounded-[14px] border border-[#2C1A0E]/15 bg-[#FAF6F0] px-4 py-3 text-sm text-[#2C1A0E] outline-none" />
                {jobMessage && <p className="text-sm text-[#C1440E]">{jobMessage}</p>}
                <button type="submit" className="inline-flex w-full items-center justify-center rounded-[14px] bg-[#C1440E] px-4 py-3 text-sm font-semibold uppercase text-[#F2E8D9]">
                  Ish e'lonini qo'shish
                </button>
              </form>
            </div>
          </aside>
        </main>

        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-xl rounded-2xl bg-[#FAF6F0] p-8 shadow-[0_30px_80px_rgba(44,26,14,0.35)]">
              <h3 className="text-2xl font-semibold text-[#2C1A0E]">{selectedJob.title}</h3>
              <p className="mt-2 text-sm text-[#2C1A0E]/70">{selectedJob.company} - {selectedJob.location}</p>
              <p className="mt-4 text-sm text-[#2C1A0E]/80">{selectedJob.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a className="inline-flex items-center justify-center rounded-md bg-[#C1440E] px-4 py-2 text-sm font-semibold text-[#F2E8D9]" href={`mailto:recruit@${selectedJob.company.replace(/\s+/g, "").toLowerCase()}.uz?subject=${encodeURIComponent(selectedJob.title)}`}>
                  Email orqali
                </a>
                <a className="inline-flex items-center justify-center rounded-md border border-[#2C1A0E] px-4 py-2 text-sm font-semibold text-[#2C1A0E]" href={`https://t.me/${selectedJob.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  Telegram
                </a>
                <button onClick={closeJob} className="inline-flex items-center justify-center rounded-md border border-[#2C1A0E] px-4 py-2 text-sm font-semibold text-[#2C1A0E]">
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmployerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-lg rounded-2xl bg-[#FAF6F0] p-8 shadow-[0_30px_80px_rgba(44,26,14,0.35)]">
              <h3 className="text-2xl font-semibold text-[#2C1A0E]">Ish beruvchi kirishini so'rash</h3>
              <p className="mt-2 text-sm text-[#2C1A0E]/70">Formani to'ldiring, biz siz bilan bog'lanamiz.</p>
              <form onSubmit={submitEmployerRequest} className="mt-4 space-y-4">
                <input required placeholder="Kompaniya nomi" className="w-full border border-[#2C1A0E]/10 px-3 py-2" />
                <input required placeholder="Email" type="email" className="w-full border border-[#2C1A0E]/10 px-3 py-2" />
                <textarea placeholder="Qisqacha ma'lumot" className="w-full border border-[#2C1A0E]/10 px-3 py-2" />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEmployerModal(false)} className="rounded-md border border-[#2C1A0E] px-4 py-2 text-sm">Bekor qilish</button>
                  <button type="submit" className="rounded-md bg-[#C1440E] px-4 py-2 text-sm font-semibold text-[#F2E8D9]">Yuborish</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
