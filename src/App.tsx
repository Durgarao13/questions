import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Code as CodeIcon, Calculator, LogOut, Database } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

const ADMIN = { username: 'admin', password: 'letlearn' } as const;
function getNYDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
}

type TQuestion = { prompt: string; choices: string[]; answerIndex: number };

const QUESTION_FILES: Record<'Python' | 'Mathematics', Record<'Basics' | 'Moderate', string>> = {
  Python: {
    Basics: '/questions/python-basics.json',
    Moderate: '/questions/python-moderate.json',
  },
  Mathematics: {
    Basics: '/questions/math-basics.json',
    Moderate: '/questions/math-moderate.json',
  },
};

function useDataStore() {
  const SUPABASE_URL =
    (window as any).__SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    '';

  const SUPABASE_ANON_KEY =
    (window as any).__SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    '';

  const supabase = useMemo(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return null;
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  type Row = {
    id?: string;
    name: string;
    date: string; // YYYY-MM-DD
    subject: 'Python' | 'Mathematics';
    correct: number;
    incorrect: number;
    created_at?: string;
  };

  const listResults = async (): Promise<Row[]> => {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('quiz_results')
      .select('id,name,date,subject,correct,incorrect,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Row[];
  };

  const upsertResult = async (row: Row): Promise<void> => {
    if (!supabase) throw new Error('Database not configured');
    const { data: existing, error: fetchErr } = await supabase
      .from('quiz_results')
      .select('id,correct,incorrect')
      .eq('name', row.name)
      .eq('subject', row.subject)
      .eq('date', row.date)
      .maybeSingle();
    if (fetchErr && (fetchErr as any).code !== 'PGRST116') throw fetchErr;

    if (existing) {
      const { error: updErr } = await supabase
        .from('quiz_results')
        .update({
          correct: (existing as any).correct + row.correct,
          incorrect: (existing as any).incorrect + row.incorrect,
        })
        .eq('id', (existing as any).id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from('quiz_results').insert([row]);
      if (insErr) throw insErr;
    }
  };

  return { listResults, upsertResult, isConfigured: !!supabase };
}

function TopBar({ onLogout, onShowAdmin }: { onLogout: () => void; onShowAdmin: () => void }) {
  return (
    <div className="w-full sticky top-0 z-10 bg-gradient-to-r from-sky-200 via-emerald-200 to-teal-200 text-slate-900 shadow">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-extrabold tracking-wide"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
          >
            Learning together <span className="ml-1 align-[-0.1em]">🤝</span>
          </span>
          <Badge className="bg-white/70 text-slate-900">Coding & Math</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onShowAdmin} className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg hover:opacity-90">
            <Database className="w-4 h-4 mr-2" /> Results
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-slate-900 hover:bg-white/60">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="w-full max-w-6xl px-6 py-12">{children}</div>
    </div>
  );
}

function ChoiceTile({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 rounded-2xl border p-6 text-lg transition shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-400 ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-500/20 text-emerald-200' : 'border-slate-600 bg-slate-800 text-white'
      }`}
    >
      <div className="p-3 rounded-xl bg-slate-700/80">{icon}</div>
      <div className="font-semibold">{label}</div>
    </motion.button>
  );
}

export default function App() {
  type Route = 'login' | 'welcome' | 'transition' | 'subject' | 'difficulty' | 'learn' | 'results' | 'admin';
  const [route, setRoute] = useState<Route>('login');

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState<'Python' | 'Mathematics' | null>(null);
  const [difficulty, setDifficulty] = useState<'Basics' | 'Moderate' | null>(null);

  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isRight, setIsRight] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const { listResults, upsertResult, isConfigured } = useDataStore();
  const [allResults, setAllResults] = useState<any[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [learn, setLearn] = useState<TQuestion[]>([]);
  const [loadingQs, setLoadingQs] = useState(false);
  const [qErr, setQErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('letslearn_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setRoute(s.route ?? 'login');
        setName(s.name ?? '');
        setSubject(s.subject ?? null);
        setDifficulty(s.difficulty ?? null);
        setQIndex(s.qIndex ?? 0);
        setCorrect(s.correct ?? 0);
        setIncorrect(s.incorrect ?? 0);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const s = { route, name, subject, difficulty, qIndex, correct, incorrect };
    sessionStorage.setItem('letslearn_session', JSON.stringify(s));
  }, [route, name, subject, difficulty, qIndex, correct, incorrect]);

  useEffect(() => {
    const load = async () => {
      if (!subject || !difficulty) {
        setLearn([]);
        return;
      }
      setLoadingQs(true);
      setQErr(null);
      try {
        const url = QUESTION_FILES[subject][difficulty];
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch ' + url);
        const data = await res.json();
        setLearn(Array.isArray(data) ? data : []);
        setQIndex(0);
        setSelected(null);
        setIsRight(null);
        setCorrect(0);
        setIncorrect(0);
      } catch (e: any) {
        setQErr(e?.message || 'Failed to load questions');
        setLearn([]);
      } finally {
        setLoadingQs(false);
      }
    };
    load();
  }, [subject, difficulty]);

  const resetLearn = () => {
    setQIndex(0);
    setCorrect(0);
    setIncorrect(0);
    setSelected(null);
    setIsRight(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === ADMIN.username && loginPass === ADMIN.password) {
      setLoginError(null);
      setRoute('welcome');
    } else {
      setLoginError('Invalid credentials. Hint: admin / letlearn');
    }
  };

  const onChoose = (idx: number) => {
    if (!learn.length) return;
    setSelected(idx);
    const isCorrect = idx === learn[qIndex].answerIndex;
    if (isCorrect) {
      setIsRight(true);
      setCorrect((c) => c + 1);
    } else {
      setIsRight(false);
      setIncorrect((c) => c + 1);
    }
  };

  const onNext = () => {
    if (isRight !== true) return;
    const last = qIndex + 1 >= learn.length;
    if (last) {
      saveAndGoToResults();
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setIsRight(null);
    }
  };

  const refreshAll = async () => {
    try {
      setLoadErr(null);
      const rows = await listResults();
      setAllResults(rows);
    } catch (e: any) {
      setLoadErr(e?.message || String(e));
    }
  };

  const saveAndGoToResults = async () => {
    if (!subject || !name) return;
    setSaving(true);
    const date = getNYDateString();
    try {
      await upsertResult({ name, date, subject, correct, incorrect });
      setSaving(false);
      setRoute('results');
      await refreshAll();
    } catch (e: any) {
      setSaving(false);
      alert('Save failed: ' + (e?.message || e));
      setRoute('results');
    }
  };

  const onLogout = () => {
    setRoute('login');
    setLoginUser('');
    setLoginPass('');
    sessionStorage.removeItem('letslearn_session');
  };

  return (
    <Shell>
      {route !== 'login' && <TopBar onLogout={onLogout} onShowAdmin={() => setRoute('admin')} />}

      {route === 'login' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <div className="max-w-2xl mx-auto space-y-10 text-center">
            <h1
              className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-500 to-sky-500 drop-shadow"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
            >
              Learning together <span className="ml-2 align-[-0.1em]">🤝</span>
            </h1>
            <Card className="rounded-3xl shadow-2xl bg-slate-900/90 border border-slate-700 backdrop-blur p-8">
              <CardHeader>
                <CardDescription className="italic text-slate-300 text-xl md:text-2xl leading-relaxed">
                  “Tell me and I forget. Teach me and I may remember. Involve me and I learn” — Confucius
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="user" className="text-base md:text-lg">Username</Label>
                    <Input id="user" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="admin" className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 h-14 text-xl" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="pass" className="text-base md:text-lg">Password</Label>
                    <Input id="pass" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="letlearn" className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 h-14 text-xl" />
                  </div>
                  {loginError && <div className="text-sm text-red-400">{loginError}</div>}
                  <Button type="submit" className="w-full h-14 text-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:opacity-90">Login</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {route === 'welcome' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-slate-900/90 border border-slate-700 backdrop-blur p-8">
            <CardHeader>
              <CardTitle className="text-3xl font-extrabold text-emerald-300">Welcome!</CardTitle>
              <CardDescription className="text-slate-200">Enter your name to begin a learning session.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jordan" className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 h-12 text-lg" />
                </div>
                <Button disabled={!name.trim()} onClick={() => setRoute('transition')} className="w-full h-12 text-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg hover:opacity-90 disabled:opacity-60">Continue</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {route === 'transition' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center text-center">
          <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-slate-900/90 border border-slate-700 backdrop-blur p-10">
            <CardHeader>
              <CardTitle className="text-3xl font-extrabold text-emerald-300 drop-shadow">Hii {name || 'there'}! 🎉</CardTitle>
              <CardDescription className="text-lg text-slate-200">Happy to have you learn with us</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setRoute('subject')} className="w-full h-12 text-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg hover:opacity-90">
                Choose a subject
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {route === 'subject' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <div className="w-full max-w-4xl space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-emerald-300">Choose a subject</h2>
              <p className="text-slate-200">Your selection will be highlighted. Then continue.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <ChoiceTile icon={<CodeIcon className="w-6 h-6" />} label="Code (Python)" selected={subject === 'Python'} onClick={() => setSubject('Python')} />
              <ChoiceTile icon={<Calculator className="w-6 h-6" />} label="Mathematics" selected={subject === 'Mathematics'} onClick={() => setSubject('Mathematics')} />
            </div>
            <div className="flex justify-end">
              <Button disabled={!subject} onClick={() => setRoute('difficulty')} className="h-12 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:opacity-90 disabled:opacity-60">Continue</Button>
            </div>
          </div>
        </div>
      )}

      {route === 'difficulty' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <div className="w-full max-w-4xl space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-emerald-300">Pick a difficulty</h2>
              <p className="text-slate-200">This will determine the set of questions.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <ChoiceTile icon={<span className="font-bold">A</span>} label="Basics" selected={difficulty === 'Basics'} onClick={() => setDifficulty('Basics')} />
              <ChoiceTile icon={<span className="font-bold">B</span>} label="Moderate" selected={difficulty === 'Moderate'} onClick={() => setDifficulty('Moderate')} />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setRoute('subject')} className="hover:bg-slate-800/60">Back</Button>
              <Button disabled={!difficulty} onClick={() => { setRoute('learn'); }} className="h-12 text-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:opacity-90 disabled:opacity-60">Start Learning</Button>
            </div>
          </div>
        </div>
      )}

      {route === 'learn' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <div className="w-full max-w-4xl space-y-6">
            <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.max(1, Math.round(((qIndex) / Math.max(learn.length, 1)) * 100))}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-emerald-300">{subject} • {difficulty}</h2>
                <p className="text-slate-200 text-sm">Question {qIndex + 1} of {learn.length}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200">End session</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Show results and save?</AlertDialogTitle>
                    <AlertDialogDescription>We'll save your current progress for today ({getNYDateString()}) under {name || 'no name'} and then navigate to the results page.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={saveAndGoToResults} disabled={saving}>{saving ? 'Saving…' : 'Show results'}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Card className="rounded-2xl shadow-2xl bg-slate-900/95 border border-slate-700 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-pink-300">{learn[qIndex]?.prompt}</CardTitle>
                <CardDescription className="text-slate-300">Select an answer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  {(learn[qIndex]?.choices ?? []).map((c, idx) => {
                    const isSelected = selected === idx;
                    const right = isRight === true && isSelected;
                    const wrong = isRight === false && isSelected;
                    return (
                      <button
                        key={idx}
                        onClick={() => onChoose(idx)}
                        className={`w-full border rounded-xl p-4 text-left text-lg flex items-center justify-between ${
                          right ? 'border-green-400 bg-green-900/40 text-green-200'
                               : wrong ? 'border-red-400 bg-red-900/40 text-red-200'
                               : isSelected ? 'border-indigo-400 bg-indigo-900/40 text-indigo-200'
                               : 'border-slate-600 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{c}</span>
                        {right && <CheckCircle2 className="w-5 h-5" />}
                        {wrong && <XCircle className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>

                {loadingQs && <div className="text-slate-200">Loading questions…</div>}
                {qErr && <div className="text-red-400">Failed to load questions: {qErr}</div>}

                <div className="flex items-center justify-between pt-4">
                  <div className="text-lg text-slate-200">Correct: {correct} • Incorrect: {incorrect}</div>
                  <Button onClick={onNext} disabled={isRight !== true} className="py-2 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg shadow-lg hover:opacity-90 disabled:opacity-60">
                    {qIndex + 1 === learn.length ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {route === 'results' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-slate-900/95 border border-slate-700 backdrop-blur p-10">
            <CardHeader>
              <CardTitle className="text-3xl font-extrabold text-emerald-300">Great work, {name || 'friend'}! 🎉</CardTitle>
              <CardDescription className="text-lg text-slate-200">Here's your learning summary for {getNYDateString()}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border bg-slate-800 border-slate-600 text-white">Subject: {subject}</div>
                <div className="p-4 rounded-xl border bg-slate-800 border-slate-600 text-white">Difficulty: {difficulty}</div>
                <div className="p-4 rounded-xl border bg-slate-800 border-slate-600 text-green-300">Correct: {correct}</div>
                <div className="p-4 rounded-xl border bg-slate-800 border-slate-600 text-red-300">Incorrect: {incorrect}</div>
              </div>
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setRoute('subject')} className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-lg shadow-lg hover:opacity-90">Continue learning</Button>
                  <Button variant="ghost" onClick={() => setRoute('difficulty')} className="hover:bg-slate-700 text-white">Try another set</Button>
                </div>
                <Button onClick={() => setRoute('admin')} className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-lg shadow-lg hover:opacity-90">
                  <Database className="w-4 h-4 mr-2" /> Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {route === 'admin' && (
        <div className="min-h-[calc(100dvh-140px)] grid place-items-center">
          <div className="w-full max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold">Saved Learning Data</h2>
                <p className="text-slate-200">Most recent sessions first • Data source: Supabase</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setRoute('subject')} className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg hover:opacity-90">Continue learning</Button>
                <Button onClick={refreshAll} className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg hover:opacity-90">Refresh</Button>
              </div>
            </div>
            {loadErr && <div className="text-sm text-red-400">Failed to load: {loadErr}</div>}

            <Card className="rounded-2xl shadow-2xl bg-slate-900/90 border border-slate-700 backdrop-blur">
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
                <CardDescription>Columns: Name • Date • Subject • Correct • Incorrect</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b bg-slate-800/60 border-slate-700 text-sky-300 font-semibold">
                        <th className="p-2 uppercase tracking-wide">Name</th>
                        <th className="p-2 uppercase tracking-wide">Date</th>
                        <th className="p-2 uppercase tracking-wide">Subject</th>
                        <th className="p-2 uppercase tracking-wide">Correct</th>
                        <th className="p-2 uppercase tracking-wide">Incorrect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allResults.map((r: any, i: number) => (
                        <tr key={r.id ?? i} className="border-b last:border-0 border-slate-700">
                          <td className="p-2 font-medium text-slate-100">{r.name}</td>
                          <td className="p-2 whitespace-nowrap text-slate-100">{r.date}</td>
                          <td className="p-2 text-slate-100">{r.subject}</td>
                          <td className="p-2 text-green-400 font-semibold">{r.correct}</td>
                          <td className="p-2 text-red-400 font-semibold">{r.incorrect}</td>
                        </tr>
                      ))}
                      {allResults.length === 0 && (
                        <tr>
                          <td className="p-3 text-slate-300" colSpan={5}>No results yet. Complete a learning session to see data here.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {!isConfigured && (
              <div className="text-red-300 text-sm">
                Database not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-4 mt-12 text-center text-xs text-slate-300">
        Tip: Configure Supabase in your Vercel project settings to enable saving.
      </footer>
    </Shell>
  );
}
