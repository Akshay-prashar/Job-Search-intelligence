"use client";

import React, { useState } from "react";
import { GraduationCap, Search, Filter, MessageSquare, Building2, Code2, Brain, Users } from "lucide-react";
import { FilterChip } from "@/components/ui/FilterChip";

const DEMO_QUESTIONS = [
  { id: 1, text: "Implement a LRU cache with O(1) get and put operations", type: "coding", difficulty: "medium", company: "Stripe", role: "frontend" },
  { id: 2, text: "Design a URL shortener service with analytics", type: "system-design", difficulty: "hard", company: "Stripe", role: "backend" },
  { id: 3, text: "Find the longest palindromic substring", type: "coding", difficulty: "medium", company: "Google", role: "fullstack" },
  { id: 4, text: "Design a rate limiter for a distributed system", type: "system-design", difficulty: "hard", company: "Cloudflare", role: "backend" },
  { id: 5, text: "Tell me about a time you had to make a decision with incomplete information", type: "behavioral", difficulty: "easy", company: "Razorpay", role: "fullstack" },
  { id: 6, text: "Implement a debounce function from scratch", type: "coding", difficulty: "easy", company: "Flipkart", role: "frontend" },
  { id: 7, text: "Two Sum — find pairs that add up to a target", type: "coding", difficulty: "easy", company: "Google", role: "fullstack" },
  { id: 8, text: "Design a real-time chat application architecture", type: "system-design", difficulty: "medium", company: "Postman", role: "fullstack" },
  { id: 9, text: "How do you handle conflicts in a team?", type: "behavioral", difficulty: "easy", company: "Razorpay", role: "fullstack" },
  { id: 10, text: "Build a binary search tree and implement in-order traversal", type: "coding", difficulty: "medium", company: "Google", role: "backend" },
  { id: 11, text: "Explain the difference between REST and GraphQL", type: "hr", difficulty: "easy", company: "Postman", role: "fullstack" },
  { id: 12, text: "Implement Promise.all from scratch", type: "coding", difficulty: "hard", company: "Stripe", role: "frontend" },
];

const TYPES = ["coding", "system-design", "behavioral", "hr"];
const DIFFICULTIES = ["easy", "medium", "hard"];

export default function InterviewsPage() {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDiff, setSelectedDiff] = useState<string[]>([]);

  const toggleArr = (arr: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const filtered = DEMO_QUESTIONS.filter(q => {
    if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedTypes.length && !selectedTypes.includes(q.type)) return false;
    if (selectedDiff.length && !selectedDiff.includes(q.difficulty)) return false;
    return true;
  });

  const typeColor = (t: string) => t === "coding" ? "text-indigo-400 bg-indigo-500/10" : t === "system-design" ? "text-violet-400 bg-violet-500/10" : t === "behavioral" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10";
  const diffColor = (d: string) => d === "hard" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : d === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  const typeIcon = (t: string) => t === "coding" ? Code2 : t === "system-design" ? Brain : t === "behavioral" ? Users : MessageSquare;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-400" /> Interview Prep</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">Curated questions from top tech companies</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input type="text" placeholder="Search questions or companies..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-10" />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => <FilterChip key={t} label={t} active={selectedTypes.includes(t)} onClick={() => toggleArr(selectedTypes, setSelectedTypes, t)} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(d => <FilterChip key={d} label={d} active={selectedDiff.includes(d)} onClick={() => toggleArr(selectedDiff, setSelectedDiff, d)} />)}
        </div>
      </div>

      <p className="text-sm text-[var(--foreground-muted)]"><span className="font-semibold text-white">{filtered.length}</span> questions</p>

      <div className="space-y-3 stagger-fade-in">
        {filtered.map((q, i) => {
          const Icon = typeIcon(q.type);
          return (
            <div key={q.id} className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColor(q.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{q.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(q.type)}`}>{q.type}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]"><Building2 className="h-3 w-3" />{q.company}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
