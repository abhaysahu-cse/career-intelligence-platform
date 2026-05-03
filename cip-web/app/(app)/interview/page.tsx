'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain,
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  Waves,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Trophy,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { interviewApi, mlServiceApi } from '@/lib/api';
import { useAppStore } from '@/store';
import AIAvatar from '@/components/interview/AIAvatar';

type InterviewPhase = 'setup' | 'listening' | 'processing' | 'summary';
type PersonaMode = 'friendly' | 'strict' | 'faang';

type QuestionPayload = {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  expected_answer?: string;
};

type FeedbackPayload = {
  score: number;
  good: string;
  missing: string;
  ideal: string;
  tip: string;
  speech_text: string;
  provider: string;
  audio?: {
    provider: string;
    mime_type: string;
    audio_base64: string;
  } | null;
};

type AnswerHistory = {
  question: string;
  answer: string;
  topic?: string;
  difficulty?: string;
  accuracy?: number;
};

type SpeechRecognitionCtor = new () => SpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

const ROLES = ['SDE', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Engineer', 'DevOps Engineer'];
const PERSONAS: Array<{ id: PersonaMode; label: string }> = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'strict', label: 'Strict' },
  { id: 'faang', label: 'FAANG' },
];

function extractWeakSkills(history: Array<AnswerHistory & { missing?: string }>) {
  const counts = new Map<string, number>();
  history.slice(-3).forEach((item) => {
    const text = `${item.topic ?? ''} ${item.missing ?? ''}`.toLowerCase();
    const tags: Array<[string, string[]]> = [
      ['time complexity', ['time complexity', 'complexity', 'big o']],
      ['edge cases', ['edge case', 'edge cases']],
      ['system design', ['system design', 'scalability', 'cache', 'load balancer']],
      ['database', ['database', 'index', 'transaction', 'sql']],
      ['communication', ['structure', 'clarity', 'example']],
    ];
    tags.forEach(([label, terms]) => {
      if (terms.some((term) => text.includes(term))) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    });
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([label]) => label);
}

export default function InterviewPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [phase, setPhase] = useState<InterviewPhase>('setup');
  const [role, setRole] = useState('SDE');
  const [persona, setPersona] = useState<PersonaMode>('friendly');
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [history, setHistory] = useState<Array<AnswerHistory & { missing?: string }>>([]);
  const [weakSkills, setWeakSkills] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState('');
  const [backendInterviewId, setBackendInterviewId] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerBufferRef = useRef('');
  const keepListeningRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resumeSkills = user?.skills ?? [];
  const resumeData = {
    skills: resumeSkills,
    persona_mode: persona,
    candidate_name: user?.name,
    branch: user?.branch,
  };

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalChunk += `${text} `;
        } else {
          interim += text;
        }
      }

      if (finalChunk.trim()) {
        answerBufferRef.current = `${answerBufferRef.current} ${finalChunk}`.trim();
        setTranscript(answerBufferRef.current);
      }

      setInterimTranscript(interim.trim());

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        if (keepListeningRef.current && !isEvaluatingRef.current) {
          void finalizeAnswer();
        }
      }, 2500);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (keepListeningRef.current && !isEvaluatingRef.current) {
        try {
          recognition.start();
        } catch {
          return;
        }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      keepListeningRef.current = false;
      recognition.stop();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const fetchNextQuestion = async (previousAnswers: AnswerHistory[]) => {
    const response = await mlServiceApi.generateInterviewQuestion({
      resume_data: resumeData,
      job_role: role,
      previous_answers: previousAnswers,
    });
    setQuestion(response.data as QuestionPayload);
  };

  const unwrapApiPayload = <T,>(payload: { data?: T | { data?: T } }) => {
    const nested = payload.data;
    if (nested && typeof nested === 'object' && 'data' in nested) {
      return (nested as { data?: T }).data as T;
    }
    return nested as T;
  };

  const speakFeedback = (payload: FeedbackPayload) => {
    window.speechSynthesis.cancel();

    if (payload.audio?.audio_base64) {
      const audio = new Audio(`data:${payload.audio.mime_type};base64,${payload.audio.audio_base64}`);
      audioRef.current = audio;
      void audio.play().catch(() => {
        const utterance = new SpeechSynthesisUtterance(payload.speech_text);
        utterance.rate = persona === 'strict' ? 1.02 : persona === 'faang' ? 0.98 : 1;
        window.speechSynthesis.speak(utterance);
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(payload.speech_text);
    utterance.rate = persona === 'strict' ? 1.02 : persona === 'faang' ? 0.98 : 1;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    keepListeningRef.current = true;
    setPhase('listening');
    try {
      recognitionRef.current.start();
    } catch {
      return;
    }
  };

  const stopInterview = async () => {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    window.speechSynthesis.cancel();
    setInterimTranscript('');
    answerBufferRef.current = '';

    // If we have answers, show summary instead of resetting
    if (history.length > 0) {
      setPhase('summary' as InterviewPhase);
      // Update interview streak
      try {
        const today = new Date().toDateString();
        const raw = localStorage.getItem('cip_streak');
        let count = 1;
        if (raw) {
          const prev = JSON.parse(raw);
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          if (prev.lastDate === today) count = prev.count;
          else if (prev.lastDate === yesterday) count = prev.count + 1;
        }
        localStorage.setItem('cip_streak', JSON.stringify({ count, lastDate: today }));
      } catch {}
    } else {
      setPhase('setup');
      setQuestion(null);
    }

    if (backendInterviewId) {
      try {
        await interviewApi.end(backendInterviewId);
      } catch {
        toast.error('Interview ended locally, but persistence could not be finalized.');
      }
    }
    setBackendInterviewId(null);
  };

  const resetInterview = () => {
    setPhase('setup');
    setQuestion(null);
    setFeedback(null);
    setHistory([]);
    setWeakSkills([]);
    setTranscript('');
    setSessionId(null);
  };

  const finalizeAnswer = async () => {
    const answer = `${answerBufferRef.current} ${interimTranscript}`.trim();
    if (!answer || !question) return;

    keepListeningRef.current = false;
    isEvaluatingRef.current = true;
    recognitionRef.current?.stop();
    setPhase('processing');
    setInterimTranscript('');

    try {
      const response = await mlServiceApi.coachInterviewAnswer({
        answer,
        job_role: role,
        resume_skills: resumeSkills,
        question: question.question,
        expected_answer: question.expected_answer,
        topic: question.topic,
        persona_mode: persona,
      });

      const nextFeedback = response.data as FeedbackPayload;
      const nextHistory = [
        ...history,
        {
          question: question.question,
          answer,
          topic: question.topic,
          difficulty: question.difficulty,
          accuracy: nextFeedback.score,
          missing: nextFeedback.missing,
        },
      ];

      setFeedback(nextFeedback);
      setHistory(nextHistory);
      setWeakSkills(extractWeakSkills(nextHistory));
      speakFeedback(nextFeedback);

      if (backendInterviewId) {
        await interviewApi.answer({
          interviewId: backendInterviewId,
          questionIndex: history.length,
          question: question.question,
          answer,
          timeTakenSeconds: 0,
          score: nextFeedback.score,
          topic: question.topic,
          difficulty: question.difficulty,
          feedback: {
            good: nextFeedback.good,
            missing: nextFeedback.missing,
            ideal: nextFeedback.ideal,
            tip: nextFeedback.tip,
          },
        });
      }

      setLastAnswer(answer);
      answerBufferRef.current = '';
      setTranscript('');
      await fetchNextQuestion(nextHistory.map(({ missing, ...item }) => item));
      keepListeningRef.current = true;
      setPhase('listening');
      recognitionRef.current?.start();
    } catch {
      toast.error('AI evaluation failed. Check the ML service or Gemini key.');
      setPhase('listening');
      keepListeningRef.current = true;
      recognitionRef.current?.start();
    } finally {
      isEvaluatingRef.current = false;
    }
  };

  const handleStart = async () => {
    if (!speechSupported) {
      toast.error('This browser does not support Web Speech API.');
      return;
    }
    try {
      setFeedback(null);
      setHistory([]);
      setWeakSkills([]);
      answerBufferRef.current = '';
      setTranscript('');
      const questionResponse = await mlServiceApi.generateInterviewQuestion({
        resume_data: resumeData,
        job_role: role,
        previous_answers: [],
      });
      const firstQuestion = questionResponse.data as QuestionPayload;
      setQuestion(firstQuestion);

      const startResponse = await interviewApi.start({
        jobRole: role,
        type: 'TECHNICAL',
        numberOfQuestions: 5,
        questions: [{
          index: 0,
          question: firstQuestion.question,
          topic: firstQuestion.topic,
          difficulty: firstQuestion.difficulty,
          expected_answer: firstQuestion.expected_answer,
        }],
      });
      const interviewSession = unwrapApiPayload<{ id: number }>(startResponse.data as { data?: { id: number } });
      if (interviewSession?.id) {
        setBackendInterviewId(interviewSession.id);
        setSessionId(String(interviewSession.id));
      }
      startListening();
    } catch {
      toast.error('Could not start the interview flow.');
    }
  };

  const liveTranscript = `${transcript}${interimTranscript ? ` ${interimTranscript}` : ''}`.trim();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>
            Real-Time AI Voice Interview
          </h2>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Speak naturally, pause for 2 to 3 seconds, and the system will coach you like a live interviewer.
          </p>
        </div>
        {sessionId && (
          <div className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
            Session {sessionId}
          </div>
        )}
      </div>

      {!speechSupported && (
        <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5' }}>
          This browser does not expose the Web Speech API, so live voice capture cannot start here.
        </div>
      )}

      {/* Interview Session Summary */}
      {phase === 'summary' && history.length > 0 && (() => {
        const overallScore = Math.round(history.reduce((sum, h) => sum + (h.accuracy ?? 0), 0) / history.length);
        const sorted = [...history].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));
        const strongest = sorted[0];
        const weakest = sorted[sorted.length - 1];
        const scoreColor = (s: number) => s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444';
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Hero Score */}
            <div className="rounded-3xl border p-8 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(6,182,212,0.1))', borderColor: 'rgba(79,70,229,0.25)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-10"
                style={{ background: 'radial-gradient(circle,#06B6D4,transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <Trophy size={32} className="mx-auto mb-3" style={{ color: '#FCD34D' }} />
              <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>Session Complete — {history.length} Questions</p>
              <p className="text-6xl font-bold grad-text" style={{ fontFamily: 'JetBrains Mono,monospace' }}>{overallScore}</p>
              <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
                {overallScore >= 75 ? '🎉 Excellent performance!' : overallScore >= 50 ? '👍 Good effort, keep improving!' : '📚 More practice recommended'}
              </p>
            </div>

            {/* Per-Question Breakdown */}
            <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h3 className="font-semibold mb-4" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Question Breakdown</h3>
              <div className="space-y-3">
                {history.map((h, idx) => {
                  const sc = h.accuracy ?? 0;
                  const isStrongest = h === strongest;
                  const isWeakest = h === weakest && history.length > 1;
                  return (
                    <div key={idx} className="rounded-xl p-3 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,70,229,0.12)', color: '#A5B4FC' }}>Q{idx + 1}</span>
                          <span className="text-xs font-semibold capitalize" style={{ color: '#94A3B8' }}>{h.topic}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: 'rgba(6,182,212,0.1)', color: '#67E8F9' }}>{h.difficulty}</span>
                          {isStrongest && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>★ Best</span>}
                          {isWeakest && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>↓ Weakest</span>}
                        </div>
                        <span className="text-lg font-bold font-mono" style={{ color: scoreColor(sc) }}>{sc}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sc}%`, background: scoreColor(sc) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weak Areas + Suggestions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: '#FCA5A5' }}>
                  <AlertCircle size={15} /> Weak Areas
                </h3>
                {weakSkills.length > 0 ? (
                  <div className="space-y-2">
                    {weakSkills.map(s => (
                      <div key={s} className="flex items-center gap-2 text-sm" style={{ color: '#E2E8F0' }}>
                        <span style={{ color: '#F59E0B' }}>⚠</span>
                        <span className="capitalize">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#94A3B8' }}>No repeated weakness detected in this session.</p>
                )}
              </div>
              <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: '#4ADE80' }}>
                  <CheckCircle2 size={15} /> Recommendation
                </h3>
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  {overallScore >= 75
                    ? 'Great performance! Move on to harder topics and system design questions.'
                    : overallScore >= 50
                    ? `Focus on ${weakest?.topic ?? 'weak topics'} and practice explaining with specific examples.`
                    : 'Start with fundamentals. Review core DSA concepts and practice structured answers with the STAR method.'}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={resetInterview}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
                <RotateCcw size={15} /> Practice Again
              </button>
              <button onClick={() => router.push('/dashboard')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                Dashboard <ArrowRight size={15} />
              </button>
              <button onClick={() => router.push('/jobs')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                View Jobs <ArrowRight size={15} />
              </button>
            </div>
          </div>
        );
      })()}

      {phase !== 'summary' && <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="mb-3 text-sm font-semibold" style={{ color: '#E2E8F0' }}>Interview Setup</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>Role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                >
                  {ROLES.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>Persona</label>
                <div className="grid grid-cols-3 gap-2">
                  {PERSONAS.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPersona(mode.id)}
                      className="rounded-xl border px-3 py-2 text-sm font-medium"
                      style={persona === mode.id
                        ? { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', borderColor: 'transparent', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-3 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#94A3B8' }}>
                Resume skills in context: {resumeSkills.length ? resumeSkills.join(', ') : 'none yet, add them in profile for better questions.'}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={phase !== 'setup' || !speechSupported}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff', opacity: phase !== 'setup' || !speechSupported ? 0.6 : 1 }}
                >
                  <Play size={15} /> Start
                </button>
                <button
                  type="button"
                  onClick={stopInterview}
                  className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{ borderColor: 'rgba(239,68,68,0.35)', color: '#FCA5A5', background: 'rgba(239,68,68,0.08)' }}
                >
                  <Square size={15} /> Stop
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="mb-3 text-sm font-semibold" style={{ color: '#E2E8F0' }}>Skill Gap Engine</p>
            {weakSkills.length ? (
              <div className="space-y-3">
                {weakSkills.map((skill, idx) => {
                  const priority = idx === 0 ? 'HIGH' : 'MEDIUM';
                  const prColor = priority === 'HIGH' ? '#EF4444' : '#F59E0B';
                  const prBg = priority === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)';
                  const fixes: Record<string, string[]> = {
                    'time complexity': ['Review Big-O notation', 'Practice analyzing nested loops'],
                    'edge cases': ['Always consider null/empty inputs', 'Think about boundary values'],
                    'system design': ['Study URL shortener design', 'Practice drawing diagrams'],
                    'database': ['Review indexing & transactions', 'Practice SQL query optimization'],
                    'communication': ['Use STAR method structure', 'Practice "First...Then...Finally"'],
                  };
                  const reasons: Record<string, string> = {
                    'time complexity': 'No complexity analysis in recent answers',
                    'edge cases': 'Missed edge cases in last 3 answers',
                    'system design': 'Incomplete architecture in recent designs',
                    'database': 'Missing DB concepts in recent answers',
                    'communication': 'Answers lack structured flow',
                  };
                  return (
                    <div key={skill} className="rounded-xl border p-3 space-y-2" style={{ borderColor: `${prColor}33`, background: prBg }}>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${prColor}22`, color: prColor, border: `1px solid ${prColor}44` }}>
                          {priority}
                        </span>
                        <span className="text-sm font-semibold capitalize" style={{ color: '#E2E8F0' }}>{skill}</span>
                      </div>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>Why: {reasons[skill] ?? 'Repeated weakness in recent answers'}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold" style={{ color: '#67E8F9' }}>Fix:</p>
                        {(fixes[skill] ?? ['Practice this topic in your next interview']).map((fix) => (
                          <p key={fix} className="text-xs pl-3" style={{ color: '#94A3B8' }}>→ {fix}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Weaknesses appear here when the last 3 answers repeat the same gap.
              </p>
            )}
          </div>
        </div>

        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-2xl border p-6" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)', minHeight: 260 }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* AI Avatar */}
                <AIAvatar
                  state={phase === 'listening' ? 'listening' : phase === 'processing' ? 'thinking' : feedback ? 'speaking' : 'idle'}
                  speechText={feedback?.speech_text}
                  personaMode={persona}
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(79,70,229,0.16)', color: '#A5B4FC' }}>
                      {question?.topic ?? 'Waiting'}
                    </div>
                    <div className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ background: 'rgba(6,182,212,0.12)', color: '#67E8F9' }}>
                      {question?.difficulty ?? 'easy'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                    {phase === 'listening' ? <Mic size={14} /> : phase === 'processing' ? <Waves size={14} /> : <MicOff size={14} />}
                    {phase === 'listening' ? 'Listening' : phase === 'processing' ? 'Evaluating' : 'Ready'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg font-semibold leading-8" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>
              {question?.question ?? 'Start the interview to get the first AI-generated question.'}
            </p>

            <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)' }}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold" style={{ color: '#94A3B8' }}>
                <Volume2 size={14} /> Live Transcript
              </div>
              <p className="min-h-24 text-sm leading-6" style={{ color: liveTranscript ? '#E2E8F0' : '#64748B' }}>
                {liveTranscript || 'Your transcript appears here while you speak. A 2.5 second pause triggers evaluation.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: '#E2E8F0' }}>
              <Brain size={16} /> Recent Answers
            </div>
            {history.length ? (
              <div className="space-y-3">
                {history.slice(-3).reverse().map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs font-semibold" style={{ color: '#A5B4FC' }}>{item.topic} • {item.accuracy}/100</p>
                    <p className="mt-1 text-sm" style={{ color: '#E2E8F0' }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#94A3B8' }}>Your last answers and scores appear here.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>AI Feedback</p>
              {feedback && (
                <div className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'rgba(6,182,212,0.12)', color: '#67E8F9' }}>
                  {feedback.score}
                </div>
              )}
            </div>

            {feedback ? (
              <div className="space-y-4">
                <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(34,197,94,0.24)', background: 'rgba(34,197,94,0.08)' }}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: '#4ADE80' }}>
                    <CheckCircle2 size={14} /> Good points
                  </div>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>{feedback.good}</p>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(239,68,68,0.24)', background: 'rgba(239,68,68,0.08)' }}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: '#FCA5A5' }}>
                    <AlertCircle size={14} /> Missing parts
                  </div>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>{feedback.missing}</p>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(79,70,229,0.24)', background: 'rgba(79,70,229,0.1)' }}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: '#A5B4FC' }}>
                    <Brain size={14} /> Ideal structure
                  </div>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>{feedback.ideal}</p>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(245,158,11,0.24)', background: 'rgba(245,158,11,0.08)' }}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: '#FCD34D' }}>
                    <Lightbulb size={14} /> Tip
                  </div>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>{feedback.tip}</p>
                </div>

                {/* Your Answer vs Ideal — Side by Side */}
                {(lastAnswer || liveTranscript) && feedback.ideal && (
                  <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="mb-2 text-xs font-semibold" style={{ color: '#94A3B8' }}>Your Answer vs Ideal</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '2px solid rgba(239,68,68,0.4)' }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#FCA5A5' }}>YOUR ANSWER</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{(lastAnswer || liveTranscript).slice(0, 200)}{(lastAnswer || liveTranscript).length > 200 ? '...' : ''}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(34,197,94,0.06)', borderLeft: '2px solid rgba(34,197,94,0.4)' }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#4ADE80' }}>IDEAL STRUCTURE</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{feedback.ideal.slice(0, 200)}{feedback.ideal.length > 200 ? '...' : ''}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  Voice provider: {feedback.provider}. Spoken feedback plays automatically after each pause.
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6" style={{ color: '#94A3B8' }}>
                The score, what was good, what was missing, the ideal short structure, and one improvement tip appear here after each spoken answer.
              </p>
            )}
          </div>
        </div>
      </div>}
    </div>
  );
}
