"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, ShieldCheck, ShieldAlert, BookOpen, User, Calendar, Printer } from "lucide-react";
import Link from "next/link";
import axios from "axios";

type VerificationData = {
  credential_id: string;
  status: string;
  student_id: string;
  student_name: string;
  course_id: number;
  course_name: string;
  course_code: string;
  issued_date: string;
  completion_date: string;
  instructor_name: string;
};

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const credentialId = params.credential_id as string;
  
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await axios.get(`${baseUrl}/certificates/verify/${credentialId}`);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Credential verification failed. The ID may be invalid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (credentialId) {
      fetchVerification();
    }
  }, [credentialId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6FA]">
        <div className="h-9 w-9 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-400">Performing cryptographic credential checks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans text-left print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl w-full mx-auto space-y-8 print:my-0 print:space-y-0">
        
        {/* Verification Status Header Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              error ? "bg-rose-50 text-rose-500 border border-rose-100" :
              data?.status === "Revoked" ? "bg-amber-50 text-amber-500 border border-amber-100" :
              "bg-emerald-50 text-emerald-500 border border-emerald-100"
            }`}>
              {error ? <ShieldAlert className="h-6 w-6" /> :
               data?.status === "Revoked" ? <ShieldAlert className="h-6 w-6" /> :
               <ShieldCheck className="h-6 w-6" />}
            </div>
            
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Credential Authenticity Check
              </p>
              <h1 className="text-base font-black text-slate-800 tracking-tight leading-tight mt-0.5">
                {error ? "Verification Failed" :
                 data?.status === "Revoked" ? "Credential Revoked" :
                 "Credential Verified & Valid"}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            {!error && data?.status !== "Revoked" && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Certificate</span>
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Main Panel Content */}
        {error ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4 print:hidden">
            <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
            <h2 className="text-lg font-black text-slate-800">Invalid Credential</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              {error}. Please verify the Credential ID or contact EduLMS registrar support.
            </p>
          </div>
        ) : data && (
          <div className="space-y-6">
            
            {/* Record metadata list */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recipient</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{data.student_name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-[#0038A8] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Course Title</span>
                  <span className="text-sm font-black text-[#0038A8] block mt-0.5">{data.course_name} ({data.course_code})</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completion Date</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">
                    {data.completion_date ? new Date(data.completion_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium printable certificate layout */}
            {data.status === "Revoked" ? (
              <div className="bg-amber-50/50 border border-dashed border-amber-200 p-8 rounded-3xl text-center space-y-4 print:hidden">
                <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
                <h3 className="text-md font-black text-amber-800">Certificate Status: Revoked</h3>
                <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                  This academic credential was officially revoked by EduLMS Administration. It is no longer valid.
                </p>
              </div>
            ) : (
              <div
                id="printable-certificate-container"
                className="bg-white border-[12px] border-double border-[#0038A8] p-12 text-center flex flex-col justify-between aspect-[4/3] max-w-3xl mx-auto relative overflow-hidden select-none print:border-[16px] print:p-16 print:my-0"
                style={{ minHeight: "500px" }}
              >
                {/* Corner Accents */}
                <div className="absolute top-2 left-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
                <div className="absolute top-2 right-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
                <div className="absolute bottom-2 left-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
                <div className="absolute bottom-2 right-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>

                {/* Certificate Header */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0038A8] block">
                    EduLMS Academic Board
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-wide">
                    CERTIFICATE OF COMPLETION
                  </h2>
                  <div className="h-[2px] w-24 bg-[#0038A8] mx-auto mt-2" />
                </div>

                {/* Certificate Content */}
                <div className="my-6 space-y-4">
                  <p className="text-xs font-medium text-slate-500 italic">
                    This is proudly presented to
                  </p>
                  <h1 className="text-3xl font-serif italic font-bold text-[#0038A8] py-1 border-b border-slate-100 max-w-md mx-auto">
                    {data.student_name}
                  </h1>
                  <p className="text-xs font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                    for successfully completing the course curriculum and exams required for
                  </p>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                    {data.course_name} ({data.course_code})
                  </h3>
                </div>

                {/* Certificate Footer */}
                <div className="grid grid-cols-3 items-end gap-4 mt-4 border-t border-slate-100 pt-6">
                  <div className="text-left space-y-1">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Issue Date</span>
                    <span className="text-xs font-bold text-slate-700 block">
                      {data.completion_date ? new Date(data.completion_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border border-[#0038A8]/20 rounded-full flex items-center justify-center text-[10px] font-black text-[#0038A8] bg-[#0038A8]/5">
                      SEAL
                    </div>
                    <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Authentic System Verification</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Board Registry</span>
                    <span className="text-xs font-bold text-[#0038A8] block font-serif italic">{data.instructor_name}</span>
                  </div>
                </div>

                {/* Verification Info */}
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                  Credential ID: {data.credential_id} · Verify at: {typeof window !== "undefined" ? `${window.location.origin}/verify-certificate/${data.credential_id}` : ""}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 mt-12 print:hidden select-none">
        Powered by EduLMS Security Board Registry · © {new Date().getFullYear()} All Rights Reserved.
      </div>

      {/* Global CSS override for print media */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate-container, #printable-certificate-container * {
            visibility: visible !important;
          }
          #printable-certificate-container {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.15) !important;
            width: 750px !important;
            height: 560px !important;
            margin: 0 !important;
            padding: 48px !important;
            box-shadow: none !important;
            border: 12px double #0038A8 !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
