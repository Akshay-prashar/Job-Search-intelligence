"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function ResumePage() {
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data.user?.currentResume) setResume(data.user.currentResume);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const handleUpload = async (file: File) => {
    if (!consent) { setError("Please accept the consent checkbox before uploading."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5MB."); return; }
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }

    setUploading(true); setError(""); setUploadProgress(10);
    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 85)), 500);

    try {
      const res = await fetch("/api/resumes/upload", { method: "POST", body: formData });
      clearInterval(interval);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      setUploadProgress(100);
      const data = await res.json();
      setResume(data.resume);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async () => {
    if (!confirm("Delete your resume and all parsed data?")) return;
    setResume(null);
    // In production: call a delete API
  };

  if (loading) return <div className="mx-auto max-w-3xl space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Resume</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">Upload your resume for AI-powered parsing and job matching</p>
      </div>

      {/* Upload Zone */}
      {!resume && (
        <>
          {/* Consent */}
          <div className="glass-card-static p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-white">Resume Parsing Consent</h3>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">By uploading, you consent to:</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-secondary)]">
                  <li>• Text extraction from your PDF</li>
                  <li>• Parsing of skills, education, projects, and experience</li>
                  <li>• Generation of an embedding vector for job matching</li>
                  <li>• Storage of parsed data in your private profile</li>
                </ul>
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">You can delete your resume and all parsed data at any time.</p>
                <label className="mt-3 flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 accent-indigo-500" />
                  <span className="text-sm font-medium text-white">I understand and consent to resume parsing</span>
                </label>
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => consent && fileRef.current?.click()}
            className={`glass-card-static cursor-pointer border-2 border-dashed p-12 text-center transition-all ${
              dragActive ? "border-indigo-500/50 bg-indigo-500/5" : consent ? "border-white/10 hover:border-indigo-500/30" : "border-white/5 opacity-50 cursor-not-allowed"
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            <Upload className={`mx-auto h-12 w-12 ${dragActive ? "text-indigo-400" : "text-[var(--foreground-muted)]"}`} />
            <p className="mt-4 text-base font-semibold text-white">
              {dragActive ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">or click to browse • PDF only • Max 5MB</p>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="glass-card-static p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin"><FileText className="h-5 w-5 text-indigo-400" /></div>
                <span className="text-sm font-medium text-white">Processing your resume...</span>
              </div>
              <ProgressBar value={uploadProgress} color="primary" showLabel />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </>
      )}

      {/* Parsed Resume Display */}
      {resume && (
        <div className="space-y-4">
          {/* Resume Info */}
          <div className="glass-card-static p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{resume.fileName}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Uploaded • Status: <span className={resume.uploadStatus === "completed" ? "text-emerald-400" : "text-amber-400"}>{resume.uploadStatus}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setResume(null); setConsent(false); }}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Re-upload
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Extracted Skills */}
          {resume.skillsJson?.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 font-semibold text-white">Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(resume.skillsJson) ? resume.skillsJson : []).map((skill: string, i: number) => (
                  <span key={i} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.educationJson?.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 font-semibold text-white">Education</h3>
              <div className="space-y-3">
                {(Array.isArray(resume.educationJson) ? resume.educationJson : []).map((edu: any, i: number) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="font-medium text-white">{edu.degree || edu.college}</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">{edu.college} {edu.graduationYear || edu.graduation_year ? `• ${edu.graduationYear || edu.graduation_year}` : ""}</p>
                    {edu.cgpa && <p className="text-xs text-[var(--foreground-muted)]">CGPA: {edu.cgpa}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projectsJson?.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 font-semibold text-white">Projects</h3>
              <div className="space-y-3">
                {(Array.isArray(resume.projectsJson) ? resume.projectsJson : []).map((proj: any, i: number) => {
                  const techList = proj.techStack || proj.tech_stack || [];
                  return (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="font-medium text-white">{proj.name}</p>
                      {proj.description && <p className="mt-1 text-sm text-[var(--foreground-secondary)]">{proj.description}</p>}
                      {techList.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {techList.map((t: string, j: number) => (
                            <span key={j} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
