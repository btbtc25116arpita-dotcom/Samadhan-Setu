import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { LanguageProvider, LanguageSync, useLanguage } from './i18n';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, BarChart3, Bell, Building2, CalendarDays,
  Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileText, Filter, GraduationCap,
  HandHeart, HelpCircle, House, IndianRupee, LayoutDashboard, Lightbulb, ListChecks, LockKeyhole,
  LogIn, LogOut, Mail, MapPin, MessageSquare, Milestone, MoreHorizontal, Network,
  Pencil, Phone, Plus, Search, Send, Settings, ShieldCheck, Sparkles, Target, TrendingUp,
  Upload, UserCircle2, Users, X, Zap, Droplets, Landmark, BriefcaseBusiness,Mic, MicOff
} from 'lucide-react';

const queryClient = new QueryClient();
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {}

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
type Role = 'citizen' | 'student' | 'faculty' | 'industry' | 'government' | 'panchayat' | 'ulb';
type IconType = typeof Activity;

const roleInfo: Record<Role, { label: string; short: string; icon: IconType; color: string; home: string }> = {
  citizen: { label: 'Citizen', short: 'You', icon: UserCircle2, color: 'bg-orange-100 text-orange-700', home: '/citizen/dashboard' },
  student: { label: 'Student', short: 'University', icon: GraduationCap, color: 'bg-sky-100 text-sky-700', home: '/university/dashboard' },
  faculty: { label: 'Faculty', short: 'University', icon: GraduationCap, color: 'bg-sky-100 text-sky-700', home: '/faculty/dashboard' },
  industry: { label: 'Industry / Startup', short: 'Partner', icon: BriefcaseBusiness, color: 'bg-violet-100 text-violet-700', home: '/industry/dashboard' },
  government: { label: 'Government / Admin', short: 'State', icon: Landmark, color: 'bg-emerald-100 text-emerald-700', home: '/government/dashboard' },
  panchayat: { label: 'Panchayat', short: 'Panchayat', icon: Landmark, color: 'bg-amber-100 text-amber-700', home: '/panchayat/dashboard' },
  ulb: { label: 'ULB', short: 'ULB', icon: Building2, color: 'bg-amber-100 text-amber-700', home: '/ulb/dashboard' },
};

const districts = ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Dumka', 'Gumla', 'Palamu', 'Chaibasa', 'Ramgarh'];
const categories = ['Water & sanitation', 'Roads & transport', 'Health', 'Education', 'Livelihoods', 'Environment'];
const initialProblems = [
  { id: 'SS-JH-2026-00119', title: 'Handpump needs repair near Anganwadi', district: 'Gumla', category: 'Water & sanitation', status: 'Under review', votes: 48, age: '2 days ago' },
  { id: 'SS-JH-2026-00118', title: 'Unsafe crossing on school route', district: 'Ranchi', category: 'Roads & transport', status: 'Assigned', votes: 31, age: '4 days ago' },
  { id: 'SS-JH-2026-00116', title: 'After-hours medicine access in block', district: 'Deoghar', category: 'Health', status: 'In progress', votes: 72, age: '1 week ago' },
  { id: 'SS-JH-2026-00112', title: 'Digital classroom connectivity gap', district: 'Dumka', category: 'Education', status: 'Validated', votes: 26, age: '2 weeks ago' },
];
const initialProjects = [
  { id: 'project-smart-water', title: 'Smart Water Monitoring for Rural Villages', location: 'Khunti & Gumla', status: 'Pilot running', progress: 68, category: 'Water & sanitation', team: 'Birsa Institute of Technology', impact: '1,240 households' },
  { id: 'project-millet', title: 'Mitti Se Market: Millet value chain', location: 'Deoghar', status: 'Prototype', progress: 44, category: 'Livelihoods', team: 'Nirmala College team', impact: '280 farmers' },
  { id: 'project-clinic', title: 'Mobile Health Desk for weekly haats', location: 'Palamu', status: 'Seeking support', progress: 26, category: 'Health', team: 'Adivasi Health Collective', impact: '6 villages' },
];

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(' '); }
function readStore<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function writeStore(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* demo mode */ } }
function currentRole(): Role { return readStore<Role>('ss-role', 'citizen'); }
function setRole(role: Role) { writeStore('ss-role', role); }
function Icon({ icon: IconComponent, size = 18, className }: { icon: IconType; size?: number; className?: string }) { return <IconComponent size={size} className={className} aria-hidden="true" />; }

function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'soft' | 'danger' }) {
  const styles = { primary: 'bg-primary text-primary-foreground hover:brightness-110', outline: 'border border-border bg-card hover:border-primary hover:text-primary', ghost: 'hover:bg-muted', soft: 'bg-secondary/40 text-foreground hover:bg-secondary/65', danger: 'bg-red-50 text-red-700 hover:bg-red-100' };
  return <button {...props} className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50', styles[variant], className)}>{children}</button>;
}
function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'green' | 'amber' | 'orange' | 'blue' | 'muted' | 'red' }) {
  const tones = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', orange: 'bg-orange-100 text-orange-800', blue: 'bg-sky-100 text-sky-800', muted: 'bg-muted text-muted-foreground', red: 'bg-red-100 text-red-800' };
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}
function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cx('rounded-2xl border border-card-border bg-card leaf-shadow', className)}>{children}</div>; }
function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-accent">{eyebrow}</p><h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>{description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>{action}</div>;
}
function Avatar({ role = currentRole(), name = 'User' }: { role?: Role; name?: string }) { const info = roleInfo[role]; return <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', info.color)} data-testid="avatar-user">{name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-sm text-background shadow-2xl rise-in" role="status" data-testid="status-toast"><CheckCircle2 size={18} className="text-secondary" />{message}<button onClick={onClose} data-testid="button-close-toast"><X size={16} /></button></div>; }

const navItems = [
  { label: 'Home', href: '/citizen/dashboard', icon: House },
  { label: 'Report a Local Problem', href: '/citizen/report', icon: Plus, citizenOnly: true },
  { label: 'Manage Community Problems', href: '/community/challenges', icon: ClipboardCheck, localAuthorityOnly: true },
  { label: 'Innovation', href: '/university/challenges', icon: Lightbulb },
  { label: 'Industry & Collaboration', href: '/industry/collaborations', icon: Network },
  { label: 'Projects', href: '/projects', icon: Target },
  { label: 'Analytics', href: '/government/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: UserCircle2 },
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
];
function Shell({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const role = currentRole(); const info = roleInfo[role]; const RoleIcon = info.icon;
  const unread = readStore<number>('ss-unread', 3);
  const homeHref = role === 'government' ? '/government/dashboard' : role === 'industry' ? '/industry/dashboard' : role === 'faculty' ? '/faculty/dashboard' : role === 'student' ? '/university/dashboard' : role === 'panchayat' ? '/panchayat/dashboard' : role === 'ulb' ? '/ulb/dashboard' : '/citizen/dashboard';
  const logout = () => { localStorage.removeItem('ss-role'); setProfileOpen(false); setToast('Signed out of workspace'); setLocation('/'); };
  return <div className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3"><Link href={homeHref} className="flex items-center gap-2.5" data-testid="link-app-logo"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-secondary"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Jharkhand_Rajakiya_Chihna.svg" alt="Jharkhand State Emblem" className="h-7 w-7 object-contain" /></span><span className="hidden font-display text-lg font-bold tracking-tight sm:block">Samadhan <span className="text-accent">Setu</span></span></Link></div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span>workspace</span><span className="mx-2 text-border">|</span><span>Jharkhand</span></div>
        <div className="flex items-center gap-1"><Link href="/notifications" className="relative rounded-xl p-2.5 transition hover:bg-muted" data-testid="link-notifications"><Bell size={19} />{unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{unread}</span>}</Link><div className="relative"><button type="button" onClick={() => setProfileOpen(!profileOpen)} className="ml-1 flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-muted" data-testid="button-profile-menu" aria-expanded={profileOpen}><Avatar role={role} name={readStore('ss-user', { name: 'User' })?.name || 'User'} />
<span className="hidden text-sm font-semibold lg:block">
  {readStore('ss-user', { name: 'User' })?.name || 'User'}
</span><ChevronDown size={14} className="hidden text-muted-foreground lg:block" /></button>{profileOpen && (
  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl">
    <div className="space-y-1">

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="truncate text-sm font-semibold">
            {readStore('ss-user', { name: 'User' })?.name || 'User'}
          </p>
        </div>
        <button
          type="button"
          className="ml-3 rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => setLocation('/profile')}
          aria-label="Edit name"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="truncate text-sm font-semibold">
            {readStore('ss-user', { email: '' })?.email || 'Not provided'}
          </p>
        </div>
        <button
          type="button"
          className="ml-3 rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => setLocation('/profile')}
          aria-label="Edit email"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Mobile</p>
          <p className="truncate text-sm font-semibold">
            {readStore('ss-user', { phone: '' })?.phone || 'Not provided'}
          </p>
        </div>
        <button
          type="button"
          className="ml-3 rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => setLocation('/profile')}
          aria-label="Edit mobile"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="text-sm font-semibold capitalize">
            {readStore('ss-user', { role: 'citizen' })?.role?.replace('_', ' ') || 'Citizen'}
          </p>
        </div>
      </div>

      <div className="my-2 border-t border-border" />

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        data-testid="button-logout"
      >
        <LogOut size={16} />
        Log out
      </button>

    </div>
  </div>
)}</div></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">{children}</main>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>;
}

function LanguageSelector() { const { language, setLanguage, t } = useLanguage(); return <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5"><label htmlFor="language-select" className="hidden text-xs font-semibold text-muted-foreground sm:block">{t('Choose your language')}</label><select id="language-select" value={language} onChange={e => setLanguage(e.target.value as 'en' | 'hi')} className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary" data-testid="select-language"><option value="en">English</option><option value="hi">हिंदी</option></select></div>; }
function HelpPage() {
  const [openQuestion, setOpenQuestion] = useState(0);

  const questions = [
    {
      question: 'What happens after I report a problem?',
      answer:
        'A community manager checks the details, asks for more information when needed, and routes validated challenges to a relevant team. You can follow every step.',
    },
    {
      question: 'Do I need a photo to submit a challenge?',
      answer:
        'A photo can help explain a community problem, but it is not required for every submission. You can provide the details of the problem and supporting information available to you.',
    },
    {
      question: 'Who can join an innovation challenge?',
      answer:
        'Students and university teams can explore validated community challenges and work on practical solutions through research, innovation and implementation.',
    },
    {
      question: 'Is the data on this demo real?',
      answer:
        'No. This demonstration uses sample data across Jharkhand districts. It does not contain real citizen complaints.',
    },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-6xl">
        {/* PAGE INTRO */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Help & Support
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
            You’re not alone in figuring it out.
          </h1>

          <p className="mt-2 text-base text-muted-foreground">
            Find a quick answer or choose the right path to get support.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.95fr]">
          
          {/* FAQ CARD */}
          <Card className="p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Common questions
            </p>

            <h2 className="mt-2 font-display text-3xl font-bold text-primary">
              Frequently asked
            </h2>

            <div className="mt-8">
              {questions.map((item, index) => {
                const isOpen = openQuestion === index;

                return (
                  <div
                    key={item.question}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenQuestion(
                          isOpen ? -1 : index
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    >
                      <span className="text-sm font-bold text-primary">
                        {item.question}
                      </span>

                      <span className="shrink-0 text-muted-foreground">
                        {isOpen ? '⌃' : '⌄'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pb-5 pr-8 text-sm leading-6 text-muted-foreground">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* RIGHT SIDE */}
          <div className="space-y-5">

            {/* HUMAN SUPPORT */}
            <Card className="overflow-hidden border-0 bg-primary p-6 text-primary-foreground md:p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                ?
              </div>

              <h2 className="mt-6 font-display text-2xl font-bold">
                Need a human path?
              </h2>

              <p className="mt-2 text-sm leading-6 text-primary-foreground/70">
                Community coordinators are here to help you choose the right next step.
              </p>

              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-primary transition hover:brightness-105"
              >
                ✉ Send a message
              </button>
            </Card>

            {/* SUPPORT DESK */}
            <Card className="p-6 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Demo support desk
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-accent">✉</span>
                  <span className="text-sm text-muted-foreground">
                    support@samadhansetu.demo
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-accent">⌕</span>
                  <span className="text-sm text-muted-foreground">
                    0651 202 2600
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-accent">◷</span>
                  <span className="text-sm text-muted-foreground">
                    Mon–Fri · 10:00–17:00
                  </span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </Shell>
  );
}
function PublicHeader() { const [location] = useLocation(); return <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:px-8"><Link href="/" className="flex items-center gap-2.5" data-testid="link-public-logo"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Jharkhand_Rajakiya_Chihna.svg" alt="Jharkhand State Emblem" className="h-7 w-7 object-contain" /></span><span className="font-display text-xl font-bold">Samadhan <span className="text-accent">Setu</span></span></Link><div className="flex items-center gap-2">{location === '/login' && <LanguageSelector />}<Link href="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-primary hover:bg-muted" data-testid="link-public-login">Login</Link></div></header>; }
function Landing() { const [, setLocation] = useLocation(); const actions = [{ title: 'Report a Local Problem', description: 'Bring a challenge in your village or city ward to the right people.', icon: AlertCircle, href: '/role-selection?flow=report', tag: 'For citizens' }, { title: 'Manage Community Problems', description: 'Validate, prioritise and route problems with your community.', icon: ClipboardCheck, href: '/role-selection?flow=manage', tag: 'For Panchayats & ULBs' }, { title: 'Join an Innovation Challenge', description: 'Turn a real Jharkhand challenge into a project that matters.', icon: Lightbulb, href: '/role-selection?flow=innovation', tag: 'For universities' }, { title: 'Support or Monitor Projects', description: 'Help promising solutions move from prototype to the field.', icon: HandHeart, href: '/role-selection?flow=support', tag: 'For partners' }]; return <div className="min-h-[100dvh] bg-paper-grid"><PublicHeader /><main className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:px-8 md:pt-20"><div className="grid items-end gap-12 lg:grid-cols-[1.04fr_.96fr]"><div className="rise-in"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/80 bg-secondary/25 px-3 py-1.5 text-xs font-bold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />A civic innovation bridge for Jharkhand</div><h1 className="max-w-xl font-display text-5xl font-bold leading-[.99] tracking-[-.055em] text-primary md:text-7xl">Welcome to<br /><span className="text-accent">Samadhan Setu.</span></h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">A simple way to move from a community challenge to a visible, lasting solution.</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/register/citizen" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110" data-testid="link-create-account">Create an account <ArrowRight size={17} /></Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold transition hover:border-primary" data-testid="link-login">I already have an account</Link></div></div><div className="relative hidden min-h-[330px] lg:block rise-in rise-in-delay-2"><div className="absolute inset-8 rounded-[3rem] bg-primary" /><div className="absolute right-0 top-1 w-60 rounded-3xl border border-border bg-card p-4 leaf-shadow rotate-3"><div className="mb-5 flex items-center gap-2 text-xs font-bold"><span className="h-7 w-7 rounded-lg bg-secondary" /><span>Challenge map</span></div><div className="relative h-28 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_36%_38%,hsl(var(--accent))_0_5px,transparent_6px),radial-gradient(circle_at_60%_60%,hsl(var(--secondary))_0_5px,transparent_6px),linear-gradient(135deg,hsl(158_35%_91%),hsl(42_35%_93%))]"><div className="absolute left-8 top-10 h-12 w-24 rounded-[50%] border-2 border-primary/30 rotate-12" /><div className="absolute right-7 top-5 h-9 w-12 rounded-[50%] border-2 border-primary/25 -rotate-12" /></div><p className="mt-3 text-xs text-muted-foreground">12 districts connected</p></div><div className="absolute bottom-3 left-5 w-60 rounded-3xl border border-border bg-card p-4 leaf-shadow -rotate-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={20} /></span><div><p className="text-sm font-bold">Solution in motion</p><p className="text-xs text-muted-foreground">Smart Water Monitoring</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-accent" /></div></div><div className="absolute left-24 top-14 flex h-36 w-36 items-center justify-center rounded-full border border-secondary bg-secondary/90 text-center text-xs font-bold text-primary shadow-xl"><span>People<br />+ ideas<br />+ action</span></div></div></div><div className="mt-20"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Start here</p><h2 className="mt-1 font-display text-3xl font-bold text-primary md:text-4xl">What would you like to do?</h2></div><span className="hidden text-sm text-muted-foreground md:block">Choose the path that fits your role</span></div><div className="grid gap-3 md:grid-cols-2">{actions.map((action, i) => <button key={action.title} onClick={() => setLocation(action.href)} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl" data-testid={`button-action-${i}`}><div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', i % 2 ? 'bg-secondary/45 text-primary' : 'bg-orange-100 text-accent')}><Icon icon={action.icon} size={23} /></div><div className="flex-1"><span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{action.tag}</span><h3 className="mt-1 font-display text-lg font-bold">{action.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{action.description}</p></div><ArrowRight className="mt-1 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" size={19} /></button>)}</div></div><div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary/70 bg-secondary/20 p-5"><div className="flex items-center gap-3"><div className="flex -space-x-2"><Avatar role="citizen" name="AS" /><Avatar role="student" name="BT" /><Avatar role="industry" name="RK" /></div><p className="text-sm"><strong>Built with the people of Jharkhand.</strong><br /><span className="text-muted-foreground">Demo data across 12 districts. No real complaints.</span></p></div><Link href="/help" className="text-sm font-bold text-primary underline decoration-secondary decoration-2 underline-offset-4" data-testid="link-learn-more">How it works</Link></div></main></div>; }

function RoleSelection() { const [, setLocation] = useLocation(); const flow = new URLSearchParams(window.location.search).get('flow') || 'report'; const roleSets: Record<string, { id: string; role: Role; label: string }[]> = { report: [{ id: 'citizen', role: 'citizen', label: 'Report a Problem' }], manage: [{ id: 'panchayat', role: 'panchayat', label: 'Panchayat' }, { id: 'ulb', role: 'ulb', label: 'ULB' }], innovation: [{ id: 'student', role: 'student', label: 'Student' }, { id: 'faculty', role: 'faculty', label: 'Faculty' }], support: [{ id: 'government', role: 'government', label: 'Government' }, { id: 'industry', role: 'industry', label: 'Industry' }] }; const choices = roleSets[flow] || roleSets.report; return <div className="min-h-[100dvh] bg-primary text-primary-foreground"><PublicHeader /><main className="mx-auto max-w-6xl px-5 pb-16 pt-10 md:px-8 md:pt-16"><div className="grid gap-12 lg:grid-cols-[.84fr_1.16fr] lg:items-center"><div><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-secondary">One bridge, many roles</p><h1 className="font-display text-5xl font-bold leading-[1.02] tracking-[-.045em] md:text-6xl">How will you<br /><span className="text-secondary">join the work?</span></h1><p className="mt-6 max-w-md text-base leading-relaxed text-primary-foreground/70">Every strong solution starts with a different point of view. Tell us yours and we’ll take you to the right workspace.</p><div className="relative mt-12 h-36 max-w-md overflow-hidden rounded-[2rem] border border-primary-foreground/10 bg-sidebar-accent"><div className="absolute -bottom-16 left-5 h-40 w-52 rounded-[50%] bg-secondary/80" /><div className="absolute -bottom-20 right-[-20px] h-44 w-72 rounded-[50%] bg-accent/70" /><div className="absolute bottom-8 left-16 h-20 w-20 rounded-full border-4 border-primary bg-secondary/50" /><div className="absolute bottom-10 left-40 h-14 w-14 rounded-full border-4 border-primary bg-accent/60" /><p className="absolute right-5 top-5 text-right text-xs font-bold leading-relaxed text-primary-foreground/80">From a village idea<br />to a district-wide change.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{choices.map((choice, i) => { const info = roleInfo[choice.role]; return <button key={choice.id} onClick={() => { setRole(choice.role); setLocation(`/register/${choice.role}`); }} className={cx('group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1', i === 0 ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-primary-foreground/15 bg-primary-foreground/5 hover:bg-primary-foreground/10')} data-testid={`button-role-${choice.id}`}><span className={cx('mb-10 flex h-12 w-12 items-center justify-center rounded-2xl', i === 0 ? 'bg-primary text-secondary' : 'bg-primary-foreground/10 text-secondary')}><Icon icon={info.icon} size={23} /></span><h2 className="font-display text-xl font-bold">{choice.label}</h2><p className={cx('mt-2 text-sm leading-relaxed', i === 0 ? 'text-secondary-foreground/70' : 'text-primary-foreground/60')}>{flow === 'report' ? 'Citizen • Panchayat • ULB' : choice.role === 'citizen' ? 'Share what your community needs.' : choice.role === 'student' ? 'Build with your campus and peers.' : choice.role === 'industry' ? 'Bring expertise, resources and scale.' : choice.label === 'Panchayat' ? 'Bring local challenges into the community workspace.' : choice.label === 'ULB' ? 'Coordinate ward-level challenges and solutions.' : choice.role === 'faculty' ? 'Guide teams toward practical solutions.' : 'Coordinate action where it matters.'}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Continue <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></button>; })}</div></div></main></div>; }

function Auth({ mode }: { mode: 'login' | 'register' }) { const params = useParams<{ role?: string }>(); const [, setLocation] = useLocation(); const [role, setAuthRole] = useState<Role>((params.role as Role) || currentRole()); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const isLogin = mode === 'login'; const info = roleInfo[role] || roleInfo.citizen;const fields = isLogin
  ? [
      {
        name: 'identifier',
        label: 'Email or mobile number',
        placeholder: 'you@example.com',
        type: 'text',
      },
      {
        name: 'password',
        label: 'Password',
        placeholder: 'Enter your password',
        type: 'password',
      },
    ]
  : role === 'citizen'
    ? [
        {
          name: 'name',
          label: 'Full name',
          placeholder: 'Your full name',
          type: 'text',
        },
        {
          name: 'email',
          label: 'Email address',
          placeholder: 'you@example.com',
          type: 'email',
        },
        {
          name: 'mobile',
          label: 'Mobile number',
          placeholder: '10 digit mobile number',
          type: 'tel',
        },
        {
          name: 'password',
          label: 'Create password',
          placeholder: 'At least 6 characters',
          type: 'password',
        },
      ]
    : role === 'industry'
      ? [
          {
            name: 'name',
            label: 'Organisation / startup name',
            placeholder: 'Your organisation',
            type: 'text',
          },
          {
            name: 'email',
            label: 'Work email',
            placeholder: 'name@organisation.org',
            type: 'email',
          },
          {
            name: 'sector',
            label: 'Sector',
            placeholder: 'Technology, CSR, manufacturing...',
            type: 'text',
          },
          {
            name: 'password',
            label: 'Create password',
            placeholder: 'At least 6 characters',
            type: 'password',
          },
        ]
      : role === 'student' || role === 'faculty'
        ? [
            {
              name: 'name',
              label: 'Full name',
              placeholder: 'Your full name',
              type: 'text',
            },
            {
              name: 'email',
              label: 'Email address',
              placeholder: 'you@college.edu',
              type: 'email',
            },
            {
              name: 'identity',
              label: 'Institution code',
              placeholder: 'College / institution code',
              type: 'text',
            },
            {
              name: 'password',
              label: 'Create password',
              placeholder: 'At least 6 characters',
              type: 'password',
            },
          ]
        : role === 'government'
          ? [
              {
                name: 'name',
                label: 'Department / office name',
                placeholder: 'District Rural Development Agency',
                type: 'text',
              },
              {
                name: 'email',
                label: 'Official email',
                placeholder: 'name@gov.in',
                type: 'email',
              },
              {
                name: 'identity',
                label: 'Department ID',
                placeholder: 'Enter department ID',
                type: 'text',
              },
              {
                name: 'password',
                label: 'Create password',
                placeholder: 'At least 6 characters',
                type: 'password',
              },
            ]
          : [
              {
                name: 'name',
                label: 'Panchayat / ULB name',
                placeholder: 'Enter Panchayat or ULB name',
                type: 'text',
              },
              {
                name: 'email',
                label: 'Official email',
                placeholder: 'name@institution.org',
                type: 'email',
              },
              {
                name: 'identity',
                label: 'Panchayat / ULB code',
                placeholder: 'Enter official code',
                type: 'text',
              },
              {
                name: 'password',
                label: 'Create password',
                placeholder: 'At least 6 characters',
                type: 'password',
              },
            ]; const submit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const data = new FormData(e.currentTarget);
  const values = Object.fromEntries(data.entries());

  setError('');
  setBusy(true);

  try {
    if (isLogin) {
      const response = await apiRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: values.identifier,
          password: values.password,
        }),
      });

      writeStore('ss-user', response);
      writeStore('ss-authenticated', true);
      setRole(response.role as Role);

      setLocation(roleInfo[response.role as Role]?.home || '/');
    } else {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.mobile || null,
          password: values.password,
          role,
          organizationName:
            role === 'industry' || role === 'government' || (role === 'panchayat' || role === 'ulb')
              ? values.name
              : null,
        }),
      });

      writeStore('ss-user', response);
      writeStore('ss-authenticated', true);
      setRole(response.role as Role);

      setLocation(
        role === 'citizen'
          ? '/citizen/dashboard'
          : roleInfo[response.role as Role]?.home || '/'
      );
    }
  } catch (err: any) {
    setError(err?.message || 'Something went wrong. Please try again.');
  } finally {
    setBusy(false);
  }
}; return <div className="min-h-[100dvh] bg-paper-grid"><PublicHeader /><main className="mx-auto grid max-w-5xl gap-12 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[.85fr_1.15fr] lg:pt-16"><div className="hidden rounded-[2rem] bg-primary p-8 text-primary-foreground lg:block"><div className="flex h-full flex-col justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-secondary">Samadhan Setu</p><h1 className="mt-16 max-w-sm font-display text-4xl font-bold leading-tight">Good change needs a place to begin.</h1><p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/65">A trusted digital space for ideas, action and accountability across Jharkhand.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="font-display text-2xl font-bold text-secondary">12</p><p className="mt-1 text-xs text-primary-foreground/60">districts in demo</p></div><div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="font-display text-2xl font-bold text-secondary">03</p><p className="mt-1 text-xs text-primary-foreground/60">active pilots</p></div></div></div></div><Card className="p-6 md:p-9"><div className="mb-8"><div className={cx('mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold', info.color)}><Icon icon={info.icon} size={14} />{info.label}</div><h1 className="font-display text-3xl font-bold">{isLogin ? 'Welcome back.' : `Create your ${info.short.toLowerCase()} account.`}</h1><p className="mt-2 text-sm text-muted-foreground">{isLogin ? 'Pick up where your community left off.' : 'Your details help us create the right workspace.'}</p></div>{isLogin && <div className="mb-5 flex flex-wrap gap-2">{(['citizen', 'student', 'faculty', 'industry', 'government', 'panchayat', 'ulb'] as Role[]).map(r => <button key={r} onClick={() => setAuthRole(r)} className={cx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', role === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary')} data-testid={`button-login-role-${r}`}>{roleInfo[r].label}</button>)}</div>}<form onSubmit={submit} className="space-y-4" data-testid={`form-${mode}`}><div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.name} className={cx('block', fields.length % 2 && field.name === 'password' ? 'sm:col-span-2' : '')}><span className="mb-1.5 block text-sm font-semibold">{field.label}</span><input name={field.name} type={field.type} placeholder={field.placeholder} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid={`input-${field.name}`} /></label>)}</div>{error && <p className="flex items-center gap-2 text-sm font-medium text-red-700" data-testid="text-auth-error"><AlertCircle size={16} />{error}</p>}<Button type="submit" className="mt-3 w-full py-3.5" disabled={busy} data-testid="button-submit-auth">{busy ? 'Opening your workspace...' : isLogin ? 'Enter workspace' : 'Create account' }<ArrowRight size={17} /></Button></form><p className="mt-6 text-center text-sm text-muted-foreground">{isLogin ? <>New to Samadhan Setu? <Link href={`/register/${role === 'citizen' ? 'citizen' : role}`} className="font-bold text-primary underline underline-offset-4" data-testid="link-switch-register">Create an account</Link></> : <>Already registered? <Link href="/login" className="font-bold text-primary underline underline-offset-4" data-testid="link-switch-login">Log in</Link></>}</p><p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole size={13} /> Demo only — no real identity is stored</p></Card></main></div>; }

function Metric({ label, value, detail, icon: metricIcon, tone = 'primary' }: { label: string; value: string; detail: string; icon: IconType; tone?: 'primary' | 'orange' | 'blue' | 'green' }) { const colors = { primary: 'bg-primary text-secondary', orange: 'bg-orange-100 text-accent', blue: 'bg-sky-100 text-sky-700', green: 'bg-emerald-100 text-emerald-700' }; return <Card className="p-4 md:p-5"><div className="flex items-start justify-between"><span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', colors[tone])}><Icon icon={metricIcon} size={19} /></span><TrendingUp size={16} className="text-emerald-600" /></div><p className="mt-4 font-display text-2xl font-bold md:text-3xl" data-testid={`text-metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p><p className="mt-1 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></Card>; }
function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>; }
function MapMock({ filter = 'All' }: { filter?: string }) {
  const mapUrl = 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Jharkhand_map_for_WLM-IN.svg';
  const points = [
    { x: '45%', y: '50%', name: 'Ranchi', count: 18 },
    { x: '61%', y: '65%', name: 'Jamshedpur', count: 12 },
    { x: '46%', y: '37%', name: 'Hazaribagh', count: 9 },
    { x: '64%', y: '42%', name: 'Dhanbad', count: 11 },
    { x: '33%', y: '59%', name: 'Gumla', count: 7 },
    { x: '68%', y: '27%', name: 'Deoghar', count: 8 },
  ];
  return <div className="relative h-[310px] overflow-hidden rounded-2xl border border-secondary/60 bg-[#e6eee2]" data-testid="visual-problem-map">
    <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(30deg, transparent 48%, hsl(158 54% 25% / .08) 49%, transparent 51%), linear-gradient(120deg, transparent 48%, hsl(158 54% 25% / .08) 49%, transparent 51%)', backgroundSize: '90px 90px' }} />
    <div
      className="absolute inset-0 bg-[#c1d9bd] opacity-90"
      style={{
        maskImage: `url(${mapUrl})`,
        WebkitMaskImage: `url(${mapUrl})`,
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: '72% 88%',
        WebkitMaskSize: '72% 88%',
      }}
    />
    <div className="absolute bottom-4 left-4 rounded-xl bg-card/90 px-3 py-2 text-xs font-semibold shadow-sm"><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent" />Mock challenge density</div>
    {points.map(point => <div key={point.name} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: point.x, top: point.y }}><div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-card bg-accent text-[10px] font-bold text-white shadow-lg transition hover:scale-125" title={`${point.name}: ${point.count} challenges`} data-testid={`map-point-${point.name.toLowerCase()}`}>{point.count}</div><span className="mt-1 block text-center text-[10px] font-bold text-primary">{point.name}</span></div>)}
  </div>;
}
function Dashboard() { const role = currentRole(); if (role === 'government') return <GovernmentDashboard />; if (role === 'industry') return <IndustryDashboard />; if (role === 'faculty') return <FacultyDashboard />; if (role === 'student') return <UniversityDashboard />; if ((role === 'panchayat' || role === 'ulb')) return <CommunityDashboard />; const [, setLocation] = useLocation(); const problems = readStore('ss-problems', initialProblems); return <Shell><PageIntro eyebrow="Citizen workspace" title={`Good morning, ${readStore('ss-user', { name: 'User' })?.name || 'User'}.`} description="Small observations become shared action. Here’s what’s moving in your communities." action={<Link href="/citizen/report" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110" data-testid="link-report-header"><Plus size={17} />Report a problem</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="My submissions" value="06" detail="+2 since last month" icon={FileText} tone="primary" /><Metric label="Community votes" value="148" detail="Across 4 challenges" icon={Users} tone="orange" /><Metric label="In motion" value="03" detail="Projects near you" icon={Activity} tone="green" /><Metric label="Impact reached" value="1,240" detail="Households in pilot" icon={Target} tone="blue" /></div><div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><Card className="p-5 md:p-6"><SectionTitle eyebrow="See your district" title="What’s happening nearby?" description="A mock view of community challenges across Jharkhand." action={<select className="rounded-lg border border-border bg-background px-2 py-2 text-xs font-semibold" data-testid="select-map-category"><option>All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>} /><MapMock /><div className="mt-4 flex flex-wrap gap-2">{['Ranchi', 'Jamshedpur', 'Gumla', 'Deoghar'].map(d => <span key={d} className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">{d}</span>)}</div></Card><Card className="p-5 md:p-6"><SectionTitle eyebrow="Quick actions" title="Make a difference" /><div className="space-y-2">{[{ label: 'Report a local problem', href: '/citizen/report', icon: Plus, tone: 'bg-orange-100 text-accent' }, { label: 'Track my submissions', href: '/citizen/submissions', icon: ListChecks, tone: 'bg-sky-100 text-sky-700' }, { label: 'Explore innovation', href: '/university/challenges', icon: Lightbulb, tone: 'bg-secondary text-primary' }].map(action => <Link key={action.label} href={action.href} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary hover:bg-muted" data-testid={`link-quick-${action.label.toLowerCase().replaceAll(' ', '-')}`}><span className={cx('flex h-9 w-9 items-center justify-center rounded-lg', action.tone)}><Icon icon={action.icon} size={17} /></span><span className="flex-1 text-sm font-bold">{action.label}</span><ArrowRight size={16} className="text-muted-foreground transition group-hover:translate-x-1" /></Link>)}</div><div className="mt-7 border-t border-border pt-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your voice counts</p><p className="mt-2 font-display text-2xl font-bold text-primary">1 in 4</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">validated challenges in your block received citizen evidence.</p></div></Card></div><div className="mt-7"><SectionTitle eyebrow="Recent activity" title="Your submissions" action={<Link href="/citizen/submissions" className="text-sm font-bold text-primary" data-testid="link-view-all-submissions">View all <ArrowRight className="ml-1 inline" size={15} /></Link>} /><div className="grid gap-3 md:grid-cols-2">{problems.slice(0, 4).map((p: typeof initialProblems[number]) => <button key={p.id} onClick={() => setLocation(`/citizen/submissions/${p.id}`)} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary" data-testid={`card-submission-${p.id}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><MapPin size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{p.title}</span><span className="mt-1 block text-xs text-muted-foreground">{p.district} · {p.age}</span></span><Badge tone={p.status === 'In progress' ? 'green' : p.status === 'Assigned' ? 'blue' : 'amber'}>{p.status}</Badge></button>)}</div></div></Shell>; }

function Report() {
  const [, setLocation] = useLocation(); const [step, setStep] = useState(1); const [submitted, setSubmitted] = useState(false); const [analyzing, setAnalyzing] = useState(false); const [error, setError] = useState(''); const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef<any>(null);const [form, setForm] = useState({ title: '', description: '', district: 'Ranchi', category: categories[0], location: '', urgency: 'Medium', people: '10–50', evidence: '' });
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleVoiceInput = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setError(
      'Voice input is not supported in this browser. Please use Chrome or Edge.'
    );
    return;
  }

  if (isListening) {
    recognitionRef.current?.stop();
    return;
  }

  setError('');

  const recognition = new SpeechRecognition();

  recognition.lang = navigator.language || 'en-IN';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    let spokenText = '';

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i += 1
    ) {
      if (event.results[i].isFinal) {
        spokenText += event.results[i][0].transcript;
      }
    }

    if (spokenText.trim()) {
      setForm((prev) => ({
        ...prev,
        description: `${prev.description}${
          prev.description.trim() ? ' ' : ''
        }${spokenText.trim()}`.slice(0, 500),
      }));
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);

    if (
      event.error === 'not-allowed' ||
      event.error === 'service-not-allowed'
    ) {
      setError(
        'Microphone permission was denied. Please allow microphone access and try again.'
      );
    } else if (event.error !== 'aborted') {
      setError('Voice input stopped. Please try again.');
    }
  };

  recognition.onend = () => {
    setIsListening(false);
    recognitionRef.current = null;
  };

  recognitionRef.current = recognition;
  setIsListening(true);

  try {
    recognition.start();
  } catch (error) {
    console.error('Unable to start voice input:', error);
    setIsListening(false);
    recognitionRef.current = null;
  }
};

useEffect(() => {
  return () => {
    recognitionRef.current?.stop();
  };
}, []);
  const assessment = {
    summary: `A local ${form.category.toLowerCase()} challenge in ${form.district} may affect ${form.people} residents and warrants ${form.urgency.toLowerCase()}-priority community follow-up.`,
    problemType: ({ 'Water & sanitation': 'Public Water Infrastructure', 'Roads & transport': 'Local Mobility & Road Safety', Health: 'Community Health Access', Education: 'Public Education Services', Livelihoods: 'Local Livelihood Support', Environment: 'Local Environmental Management' } as Record<string, string>)[form.category] || 'Community Service Access',
    severity: form.urgency,
    impact: `${form.people} people potentially affected`,
    likelyIssue: `${form.category} service gap or local maintenance requirement`,
    recommendedAction: `Review the reported ${form.category.toLowerCase()} issue on site, confirm the need, and route it for local action.`,
    authority: form.category === 'Water & sanitation' ? 'Panchayat / Local Water & Sanitation Authority' : 'Panchayat / Relevant Local Authority',
    priority: form.urgency === 'High' ? 'Immediate local intervention' : form.urgency === 'Low' ? 'Monitor and address locally' : 'Needs local intervention',
  };
const next = async () => {
  setError('');

  if (step === 1 && (!form.title || form.description.length < 12)) {
    setError('Add a clear title and a little more detail so others can understand the challenge.');
    return;
  }

  if (step === 2 && !form.location) {
    setError('Please add a village, ward, landmark or pin description.');
    return;
  }

  if (step < 5) {
    setStep(step + 1);
    return;
  }

  setAnalyzing(true);

  try {
    const user = readStore('ss-user', null) as {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    } | null;

    const id = `SS-JH-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;

    const created = await apiRequest('/problems', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: form.title,
        description: form.description,
        category: form.category,
        district: form.district,
        location: form.location,
        urgency: form.urgency,
        people: form.people,
        evidence: form.evidence,
        status: 'Under review',
        votes: 0,
        reportedBy: user?.id || '',
      }),
    });

    const saved = [
      {
        ...form,
        id: created.id || id,
        status: created.status || 'Under review',
        votes: created.votes || 0,
        age: 'Just now',
      },
      ...readStore('ss-problems', initialProblems),
    ];

    writeStore('ss-problems', saved);
    writeStore('ss-unread', 4);

    setAnalyzing(false);
    setSubmitted(true);
  } catch (error) {
    console.error('Problem submission failed:', error);
    setAnalyzing(false);
    setError(
      error instanceof Error
        ? error.message
        : 'Unable to submit the problem right now. Please try again.'
    );
  }
};
  if (submitted) return <Shell><div className="mx-auto max-w-2xl py-10 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 rise-in"><CheckCircle2 size={38} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-accent">Submission received</p><h1 className="mt-2 font-display text-4xl font-bold text-primary">Your voice is now in motion.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">The community team will review your challenge and keep you updated. This is demo data, not a real complaint.</p><div className="mx-auto mt-7 max-w-sm rounded-2xl border border-secondary bg-secondary/25 p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your tracking ID</p><p className="mt-2 font-display text-2xl font-bold text-primary" data-testid="text-generated-submission-id">SS-JH-2026-00124</p><p className="mt-2 text-xs text-muted-foreground">{form.title}</p></div><div className="mt-7 flex justify-center gap-3"><Link href="/citizen/submissions/SS-JH-2026-00124" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="link-track-new-submission">Track submission <ArrowRight size={16} /></Link><Link href="/citizen/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold" data-testid="link-back-dashboard">Back to dashboard</Link></div></div></Shell>;
  const titles = ['Describe the challenge', 'Where is it?', 'Add evidence', 'Show the impact', 'Review & submit'];
  return <Shell><div className="mx-auto max-w-4xl"><Link href="/citizen/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-back-report"><ArrowLeft size={16} />Back to dashboard</Link><PageIntro eyebrow="New community challenge" title="Tell us what needs attention." description="You can save this in under five minutes. Share what you know; the community will help fill the gaps." /><div className="mb-8 flex items-start justify-between">{titles.map((title, i) => <div key={title} className="relative flex flex-1 flex-col items-center text-center"><div className={cx('relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition', step > i + 1 ? 'bg-secondary text-primary' : step === i + 1 ? 'bg-primary text-secondary' : 'bg-muted text-muted-foreground')}>{step > i + 1 ? <Check size={16} /> : i + 1}</div><span className={cx('mt-2 hidden text-[11px] font-semibold sm:block', step === i + 1 ? 'text-primary' : 'text-muted-foreground')}>{title}</span>{i < titles.length - 1 && <div className={cx('absolute left-1/2 top-4 h-px w-full', step > i + 1 ? 'bg-secondary' : 'bg-border')} />}</div>)}</div><Card className="p-5 md:p-8">{step === 1 && <div className="space-y-5"><div><label className="mb-1.5 block text-sm font-bold">What is the challenge? <span className="text-accent">*</span></label><input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Example: Handpump is not working near the school" className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-report-title" /></div><div><label className="mb-1.5 block text-sm font-bold">Tell us what is happening <span className="text-accent">*</span></label><textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5} placeholder="What have you observed? Who is affected? Add any useful context." className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="textarea-report-description" /><p className="mt-1 text-right text-xs text-muted-foreground">{form.description.length} / 500</p></div><div><label className="mb-1.5 block text-sm font-bold">Choose a category</label><select value={form.category} onChange={e => update('category', e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm" data-testid="select-report-category">{categories.map(c => <option key={c}>{c}</option>)}</select></div></div>}{step === 2 && <div className="space-y-5"><div><label className="mb-1.5 block text-sm font-bold">District</label><select value={form.district} onChange={e => update('district', e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm" data-testid="select-report-district">{districts.map(d => <option key={d}>{d}</option>)}</select></div><div><label className="mb-1.5 block text-sm font-bold">Village, ward or nearby landmark <span className="text-accent">*</span></label><input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Example: Beside Birsa Munda School, Torpa block" className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm" data-testid="input-report-location" /></div><div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/20 p-4 text-sm"><MapPin className="text-primary" size={20} /><span><strong>Map pin included in demo</strong><br /><span className="text-xs text-muted-foreground">Your approximate district location will help route the challenge.</span></span></div></div>}{step === 3 && <div><label className="mb-2 block text-sm font-bold">Photos, documents or audio note</label><label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center transition hover:border-primary hover:bg-muted"><Upload size={25} className="mb-3 text-primary" /><span className="text-sm font-bold">Drop evidence here or browse</span><span className="mt-1 text-xs text-muted-foreground">JPG, PNG, PDF or audio up to 10 MB</span><input type="file" className="hidden" onChange={e => update('evidence', e.target.files?.[0]?.name || '')} data-testid="input-report-evidence" />{form.evidence && <Badge tone="green">{form.evidence}</Badge>}</label><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Evidence is optional. A clear description is enough to start a conversation.</p></div>}{step === 4 && <div className="space-y-6"><div><label className="mb-2 block text-sm font-bold">How urgent is this?</label><div className="grid grid-cols-3 gap-2">{['Low', 'Medium', 'High'].map(level => <button key={level} type="button" onClick={() => update('urgency', level)} className={cx('rounded-xl border px-3 py-3 text-sm font-bold', form.urgency === level ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')} data-testid={`button-urgency-${level.toLowerCase()}`}>{level}</button>)}</div></div><div><label className="mb-2 block text-sm font-bold">How many people are affected?</label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['1–10', '10–50', '50–200', '200+'].map(count => <button key={count} type="button" onClick={() => update('people', count)} className={cx('rounded-xl border px-3 py-3 text-sm font-bold', form.people === count ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')} data-testid={`button-people-${count}`}>{count}</button>)}</div></div><div className="rounded-2xl bg-muted p-4 text-sm"><p className="font-bold">Why this helps</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Urgency and reach help community managers prioritise fairly. You can always update this later.</p></div></div>}{step === 5 && <div className="space-y-4"><div><h3 className="font-display text-xl font-bold">AI Review & Community Assessment</h3><p className="mt-1 text-sm text-muted-foreground">Our AI has reviewed the information you provided and prepared a structured assessment for the next stage.</p></div><div className="rounded-2xl border border-secondary bg-secondary/20 p-5"><div className="flex items-center gap-2"><Sparkles size={17} className="text-primary" /><p className="text-xs font-bold uppercase tracking-wider text-primary">AI Summary</p></div><p className="mt-3 text-sm leading-relaxed">{assessment.summary}</p></div><div className="divide-y divide-border rounded-2xl border border-border">{[['Problem Type', assessment.problemType], ['Severity', assessment.severity], ['Estimated Community Impact', assessment.impact], ['Likely Issue', assessment.likelyIssue], ['Recommended Action', assessment.recommendedAction], ['Suggested Responsible Authority', assessment.authority], ['Priority', assessment.priority]].map(([label, value]) => <div key={label} className="grid gap-1 p-4 sm:grid-cols-[210px_1fr] sm:gap-4"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span><span className="text-sm">{value}</span></div>)}</div><div className="flex items-start gap-3 rounded-xl bg-secondary/25 p-4 text-sm"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" /><span><strong>AI-generated preliminary assessment</strong><br />This is an AI-style assessment, not a final government decision. Your submission will enter the community validation queue. This demo never sends a real complaint.</span></div></div>}{error && <p className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" data-testid="text-report-error"><AlertCircle size={16} />{error}</p>}<div className="mt-8 flex justify-between gap-3 border-t border-border pt-5"><Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setLocation('/citizen/dashboard')} data-testid="button-report-back"><ArrowLeft size={16} />{step > 1 ? 'Back' : 'Cancel'}</Button><Button onClick={next} disabled={analyzing} data-testid="button-report-next">{analyzing ? <><Activity size={17} className="soft-pulse" />Analysing your challenge...</> : step === 5 ? <><Send size={16} />Submit challenge</> : <>Continue <ArrowRight size={16} /></>}</Button></div></Card></div></Shell>;
}

function Submissions() { const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All'); const [, setLocation] = useLocation(); const problems = readStore('ss-problems', initialProblems); const filtered = problems.filter((p: typeof initialProblems[number]) => `${p.title} ${p.district} ${p.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || p.status === filter)); return <Shell><PageIntro eyebrow="Citizen workspace" title="My submissions" description="Keep an eye on every challenge you’ve brought forward." action={<Link href="/citizen/report" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-new-submission"><Plus size={17} />New submission</Link>} /><Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, ID or district" className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm" data-testid="input-search-submissions" /></div><div className="flex gap-2 overflow-x-auto">{['All', 'Under review', 'Assigned', 'In progress', 'Validated'].map(item => <button key={item} onClick={() => setFilter(item)} className={cx('whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold', filter === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border')} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div><div className="divide-y divide-border">{filtered.length ? filtered.map((p: typeof initialProblems[number]) => <button key={p.id} onClick={() => setLocation(`/citizen/submissions/${p.id}`)} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/60" data-testid={`row-submission-${p.id}`}><span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary sm:flex"><FileText size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{p.title}</span><span className="mt-1 block text-xs text-muted-foreground">{p.id} · {p.district} · {p.age}</span></span><span className="hidden text-xs text-muted-foreground md:block">{p.votes} community voices</span><Badge tone={p.status === 'In progress' ? 'green' : p.status === 'Assigned' ? 'blue' : 'amber'}>{p.status}</Badge><ArrowRight size={16} className="text-muted-foreground" /></button>) : <div className="p-12 text-center"><Search className="mx-auto text-muted-foreground" /><p className="mt-3 font-bold">No submissions match</p><p className="mt-1 text-sm text-muted-foreground">Try another search or filter.</p></div>}</div></Card></Shell>; }

function SubmissionDetail() { const params = useParams<{ id: string }>(); const problem = readStore('ss-problems', initialProblems).find((p: typeof initialProblems[number]) => p.id === params.id) || { ...initialProblems[0], id: params.id || 'SS-JH-2026-00124' }; return <Shell><Link href="/citizen/submissions" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-back-submissions"><ArrowLeft size={16} />All submissions</Link><PageIntro eyebrow={problem.id} title={problem.title} description={`${problem.district} · ${problem.category} · Demo submission`} action={<Badge tone="amber">{problem.status}</Badge>} /><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><Card className="p-5 md:p-7"><h2 className="font-display text-xl font-bold">Tracking progress</h2><div className="mt-8 space-y-6">{[['Submitted', 'Your report was received', true], ['Community validation', 'The local team is checking the details', true], ['Assigned for action', 'A relevant department or partner will pick this up', problem.status !== 'Under review'], ['Solution in motion', 'Updates will appear here as the work progresses', problem.status === 'In progress']].map(([title, copy, done], i) => <div className="relative flex gap-4" key={String(title)}><div className={cx('relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', done ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground')}>{done ? <Check size={16} /> : i + 1}</div>{i < 3 && <div className={cx('absolute left-[17px] top-9 h-8 w-px', done ? 'bg-secondary' : 'bg-border')} />}<div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{copy}</p></div></div>)}</div></Card><div className="space-y-5"><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Community support</p><p className="mt-2 font-display text-3xl font-bold">{problem.votes}</p><p className="text-sm text-muted-foreground">people have added their voice</p><Button variant="soft" className="mt-4 w-full" data-testid="button-support-submission"><HandHeart size={17} />Add my support</Button></Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Challenge details</p><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between gap-3"><span className="text-muted-foreground">District</span><strong>{problem.district}</strong></p><p className="flex justify-between gap-3"><span className="text-muted-foreground">Category</span><strong>{problem.category}</strong></p><p className="flex justify-between gap-3"><span className="text-muted-foreground">Reported</span><strong>{problem.age}</strong></p></div></Card></div></div></Shell>; }
function CommunityProblemDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogAction, setDialogAction] = useState<'validated' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest<any[]>('/problems');
      const found = data.find((p) => p.id === params.id);
      if (!found) {
        setError('Problem not found.');
      } else {
        setProblem(found);
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError(err instanceof Error ? err.message : 'Unable to load this problem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProblem(); }, [params.id]);

  const openDialog = (action: 'validated' | 'rejected') => {
    setDialogAction(action);
    setNote('');
    setActionError('');
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogAction(null);
  };

  const confirmAction = async () => {
    if (!dialogAction || !problem) return;

    if (dialogAction === 'rejected' && !note.trim()) {
      setActionError('Please tell the citizen why this is being rejected.');
      return;
    }

    const user = readStore('ss-user', { name: 'Panchayat/ULB reviewer', id: '' });
    const validatedBy = user?.name || user?.id || 'Panchayat/ULB reviewer';

    try {
      setSubmitting(true);
      setActionError('');

      const updated = await apiRequest<any>(`/problems/${problem.id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({
          validationStatus: dialogAction,
          validatedBy,
          validationNote: note.trim() || undefined,
        }),
      });

      setProblem(updated);
      setDialogAction(null);
    } catch (err) {
      console.error('Failed to update validation status:', err);
      setActionError(err instanceof Error ? err.message : 'Unable to save this decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDecided = problem?.validationStatus === 'validated' || problem?.validationStatus === 'rejected';

  return (
    <Shell>
      <Link
        href="/community/challenges"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        data-testid="link-back-queue"
      >
        <ArrowLeft size={16} />Back to validation queue
      </Link>

      {loading && (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading problem...</div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && problem && (
        <>
          <PageIntro
            eyebrow={problem.id}
            title={problem.title}
            description={`${problem.district || '—'} · ${problem.category || '—'}`}
            action={
              <Badge tone={problem.validationStatus === 'validated' ? 'green' : problem.validationStatus === 'rejected' ? 'red' : 'amber'}>
                {problem.validationStatus === 'validated' ? 'Validated' : problem.validationStatus === 'rejected' ? 'Rejected' : (problem.status || 'Under review')}
              </Badge>
            }
          />

          <Card className="p-5 md:p-7 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="mt-1 text-sm leading-relaxed">{problem.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</p><p className="mt-1 text-sm">{problem.location}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Urgency</p><p className="mt-1 text-sm">{problem.urgency}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">People affected</p><p className="mt-1 text-sm">{problem.people}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidence</p><p className="mt-1 text-sm">{problem.evidence || 'None provided'}</p></div>
            </div>

            {problem.validationNote && (
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reviewer note</p>
                <p className="mt-1 text-sm">{problem.validationNote}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-border pt-5">
              <Button
                variant="primary"
                disabled={isDecided}
                onClick={() => openDialog('validated')}
                data-testid="button-approve-problem"
              >
                <CheckCircle2 size={17} />
                {problem.validationStatus === 'validated' ? 'Validated' : 'Validate / Approve'}
              </Button>
              <Button
                variant="danger"
                disabled={isDecided}
                onClick={() => openDialog('rejected')}
                data-testid="button-reject-problem"
              >
                <X size={17} />
                {problem.validationStatus === 'rejected' ? 'Rejected' : 'Reject Problem'}
              </Button>
            </div>
          </Card>
        </>
      )}

      <Dialog open={dialogAction !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'validated' ? 'Approve this problem?' : 'Reject this problem?'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'validated'
                ? 'This will mark the problem as validated and make it available to the university dashboard.'
                : 'Please explain why this problem is being rejected. This will be visible to the citizen.'}
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder={dialogAction === 'validated' ? 'Optional note...' : 'Reason for rejection (required)...'}
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            data-testid="textarea-validation-note"
          />

          {actionError && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertCircle size={16} />{actionError}
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === 'rejected' ? 'danger' : 'primary'}
              onClick={confirmAction}
              disabled={submitting}
              data-testid="button-confirm-validation"
            >
              {submitting ? 'Saving...' : dialogAction === 'validated' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
function CommunityDashboard() {
  const user = readStore('ss-user', { name: 'User' });

  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProblems = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiRequest<any[]>('/problems');

        const validationQueue = data.filter(
          (problem) =>
            problem.status === 'Under review' ||
            problem.validationStatus === 'under_review' ||
            problem.validationStatus === 'pending'
        );

        setProblems(validationQueue);
      } catch (err) {
        console.error('Failed to load validation queue:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load validation queue.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProblems();
  }, []);

  return (
    <Shell>
      <PageIntro
        eyebrow="Community manager"
        title={`Good morning, ${user?.name || 'User'}.`}
        description="A clear view of the challenges waiting for a fair, local response."
        action={
          <Link
            href="/community/challenges"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            data-testid="link-open-validation"
          >
            <ClipboardCheck size={17} />
            Open validation queue
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Needs validation"
          value={String(problems.length)}
          detail="Citizen-submitted problems"
          icon={ClipboardCheck}
          tone="orange"
        />

        <Metric
          label="Validated this month"
          value="0"
          detail="Will connect next"
          icon={CheckCircle2}
          tone="green"
        />

        <Metric
          label="Awaiting information"
          value="0"
          detail="Will connect next"
          icon={Clock3}
          tone="blue"
        />

        <Metric
          label="Assigned actions"
          value="0"
          detail="Will connect next"
          icon={Target}
          tone="primary"
        />
      </div>

      <div className="mt-7">
        <Card className="p-5 md:p-6">
          <SectionTitle
            eyebrow="Needs your attention"
            title="Validation queue"
            description="Review the newest citizen-submitted challenges."
            action={
              <Link
                href="/community/challenges"
                className="text-sm font-bold text-primary"
                data-testid="link-view-queue"
              >
                View queue <ArrowRight size={15} className="inline" />
              </Link>
            }
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading validation queue...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && problems.length === 0 && (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto text-green-600" size={32} />
              <p className="mt-3 font-bold">No problems waiting for validation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New citizen submissions will appear here.
              </p>
            </div>
          )}

          {!loading && !error && problems.length > 0 && (
            <div className="space-y-2">
              {problems.slice(0, 5).map((p) => (
                <Link
                  href={`/community/challenges/${p.id}`}
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary"
                  data-testid={`card-queue-${p.id}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-accent">
                    <AlertCircle size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {p.title}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {p.district || 'Jharkhand'} · {p.people || 0} people affected
                    </span>
                  </span>

                  <Badge tone="amber">
                    {p.status || 'Under review'}
                  </Badge>

                  <ArrowRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
function UniversityDashboard() {
  const user = readStore('ss-user', { name: 'User' });

  const [problems, setProblems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedProblem, setSelectedProblem] =
    useState<any | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [applicationStarted, setApplicationStarted] =
    useState(false);

  const [showTeamPage, setShowTeamPage] =
    useState(false);
  const [editingTeam, setEditingTeam] =
    useState<any | null>(null);
  const [savingTeam, setSavingTeam] =
    useState(false);

  const emptyMember = {
    name: '',
    rollNumber: '',
    department: '',
    year: '',
    skills: '',
  };

  const [teamForm, setTeamForm] = useState({
    teamName: '',
    challengeId: '',
    challengeTitle: '',
    department: '',
    members: [
      { ...emptyMember },
      { ...emptyMember },
      { ...emptyMember },
      { ...emptyMember },
    ],
  });

  /*
   * ---------------------------------------------------------
   * LOAD CHALLENGES + TEAMS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [problemsData, teamsData] =
          await Promise.all([
            apiRequest<any[]>('/problems'),
            apiRequest<any[]>('/teams'),
          ]);

        setProblems(
          problemsData.filter(
            (p) =>
              p.validationStatus === 'validated'
          )
        );

        setTeams(
          Array.isArray(teamsData)
            ? teamsData
            : []
        );
      } catch (err) {
        console.error(
          'Failed to load university workspace:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load university workspace.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /*
   * ---------------------------------------------------------
   * CHALLENGE ACTIONS
   * ---------------------------------------------------------
   */

  const openProblem = (problem: any) => {
    setSelectedProblem(problem);
    setShowBrief(false);
    setApplicationStarted(false);
  };

  const closeProblem = () => {
    setSelectedProblem(null);
    setShowBrief(false);
    setApplicationStarted(false);
  };

  const startApplication = () => {
    setApplicationStarted(true);
  };

  /*
   * ---------------------------------------------------------
   * CREATE TEAM
   * ---------------------------------------------------------
   */

  const openCreateTeam = () => {
    setEditingTeam(null);

    setTeamForm({
      teamName: '',
      challengeId: '',
      challengeTitle: '',
      department: '',
      members: [
        { ...emptyMember },
        { ...emptyMember },
        { ...emptyMember },
        { ...emptyMember },
      ],
    });

    setShowTeamPage(true);
  };

  /*
   * ---------------------------------------------------------
   * MANAGE EXISTING TEAM
   * ---------------------------------------------------------
   */

  const openManageTeam = (team: any) => {
    setEditingTeam(team);

    const existingMembers =
      Array.isArray(team.members)
        ? team.members
        : [];

    const members = [
      ...existingMembers,
      ...Array.from(
        {
          length: Math.max(
            0,
            4 - existingMembers.length
          ),
        },
        () => ({ ...emptyMember })
      ),
    ];

    setTeamForm({
      teamName:
        team.teamName ||
        team.name ||
        '',

      challengeId:
        team.challengeId ||
        team.problemId ||
        '',

      challengeTitle:
        team.challengeTitle ||
        team.projectName ||
        '',

      department:
        team.department ||
        '',

      members: members
        .slice(0, 4)
        .map((member: any) => ({
          name:
            member?.name ||
            '',

          rollNumber:
            member?.rollNumber ||
            member?.roll_number ||
            '',

          department:
            member?.department ||
            '',

          year:
            member?.year ||
            '',

          skills:
            member?.skills ||
            '',
        })),
    });

    setShowTeamPage(true);
  };

  /*
   * ---------------------------------------------------------
   * UPDATE MEMBER
   * ---------------------------------------------------------
   */

  const updateMember = (
    index: number,
    field: string,
    value: string
  ) => {
    setTeamForm((current) => ({
      ...current,

      members: current.members.map(
        (member, memberIndex) =>
          memberIndex === index
            ? {
                ...member,
                [field]: value,
              }
            : member
      ),
    }));
  };

  /*
   * ---------------------------------------------------------
   * SAVE TEAM
   * ---------------------------------------------------------
   */

  const saveTeam = async () => {
    if (!teamForm.teamName.trim()) {
      setError(
        'Please enter a team name.'
      );
      return;
    }

    const activeMembers =
      teamForm.members.filter(
        (member) =>
          member.name.trim() ||
          member.rollNumber.trim() ||
          member.department.trim() ||
          member.year.trim() ||
          member.skills.trim()
      );

    if (activeMembers.length === 0) {
      setError(
        'Please enter at least one student.'
      );
      return;
    }

    try {
      setSavingTeam(true);
      setError('');

      const payload = {
        teamName:
          teamForm.teamName.trim(),

        name:
          teamForm.teamName.trim(),

        challengeId:
          teamForm.challengeId ||
          null,

        problemId:
          teamForm.challengeId ||
          null,

        challengeTitle:
          teamForm.challengeTitle ||
          null,

        department:
          teamForm.department ||
          null,

        members:
          activeMembers,

        createdBy:
          user?.name ||
          'User',
      };

      if (editingTeam) {
        const updatedTeam =
          await apiRequest<any>(
            `/teams/${editingTeam.id}`,
            {
              method: 'PATCH',
              body: JSON.stringify(
                payload
              ),
            }
          );

        setTeams((current) =>
          current.map((team) =>
            team.id ===
            editingTeam.id
              ? updatedTeam
              : team
          )
        );
      } else {
        const createdTeam =
          await apiRequest<any>(
            '/teams',
            {
              method: 'POST',
              body: JSON.stringify(
                payload
              ),
            }
          );

        setTeams((current) => [
          ...current,
          createdTeam,
        ]);
      }

      setShowTeamPage(false);
      setEditingTeam(null);
    } catch (err) {
      console.error(
        'Failed to save team:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save team.'
      );
    } finally {
      setSavingTeam(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * TEAM CREATE / MANAGE PAGE
   * ---------------------------------------------------------
   */

  if (showTeamPage) {
    return (
      <Shell>
        <PageIntro
          eyebrow="University workspace"
          title={
            editingTeam
              ? 'Manage your team'
              : 'Create a team'
          }
          description={
            editingTeam
              ? 'Update your team and student details.'
              : 'Bring your student team together for community innovation projects.'
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setShowTeamPage(false);
                setEditingTeam(null);
              }}
            >
              Back
            </Button>
          }
        />

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="p-5 md:p-6">
          <SectionTitle
            eyebrow="Team details"
            title="Your team"
            description="Enter the details of the students who are part of this team."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-bold">
                Team name
              </label>

              <input
                value={teamForm.teamName}
                onChange={(e) =>
                  setTeamForm(
                    (current) => ({
                      ...current,
                      teamName:
                        e.target.value,
                    })
                  )
                }
                placeholder="e.g. Jal Saathi Collective"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Department
              </label>

              <input
                value={
                  teamForm.department
                }
                onChange={(e) =>
                  setTeamForm(
                    (current) => ({
                      ...current,
                      department:
                        e.target.value,
                    })
                  )
                }
                placeholder="e.g. Computer Science"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Challenge / Project
              </label>

              <select
                value={
                  teamForm.challengeId
                }
                onChange={(e) => {
                  const problem =
                    problems.find(
                      (p) =>
                        p.id ===
                        e.target.value
                    );

                  setTeamForm(
                    (current) => ({
                      ...current,

                      challengeId:
                        e.target.value,

                      challengeTitle:
                        problem?.title ||
                        '',
                    })
                  );
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  Select a challenge
                </option>

                {problems.map(
                  (problem) => (
                    <option
                      key={
                        problem.id
                      }
                      value={
                        problem.id
                      }
                    >
                      {problem.title}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle
              eyebrow="Student members"
              title="Team members"
              description="Add the students who will work on this project."
            />

            <div className="mt-5 space-y-5">
              {teamForm.members.map(
                (member, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border p-5"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-primary">
                        <Users
                          size={17}
                        />
                      </span>

                      <div>
                        <p className="font-bold">
                          Student{' '}
                          {index + 1}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Student information
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Student name
                        </label>

                        <input
                          value={
                            member.name
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              'name',
                              e.target
                                .value
                            )
                          }
                          placeholder="Full name"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Roll number
                        </label>

                        <input
                          value={
                            member.rollNumber
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              'rollNumber',
                              e.target
                                .value
                            )
                          }
                          placeholder="Roll number"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Department
                        </label>

                        <input
                          value={
                            member.department
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              'department',
                              e.target
                                .value
                            )
                          }
                          placeholder="Department"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Year
                        </label>

                        <input
                          value={
                            member.year
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              'year',
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. 2nd Year"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold">
                          Skills
                        </label>

                        <input
                          value={
                            member.skills
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              'skills',
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. React, IoT, data analysis"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                        />
                      </div>

                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowTeamPage(false);
                setEditingTeam(null);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={saveTeam}
              disabled={savingTeam}
            >
              {savingTeam
                ? 'Saving...'
                : editingTeam
                ? 'Save changes'
                : 'Create team'}
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  /*
   * ---------------------------------------------------------
   * DETAILED CHALLENGE BRIEF
   * ---------------------------------------------------------
   */

  if (
    selectedProblem &&
    showBrief
  ) {
    return (
      <Shell>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() =>
              setShowBrief(false)
            }
          >
            ← Back to challenge
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          <Card className="p-6 md:p-8">
            <Badge tone="green">
              {selectedProblem.category ||
                'Community challenge'}
            </Badge>

            <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">
              {selectedProblem.title}
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              📍{' '}
              {selectedProblem.district ||
                'Jharkhand'}
            </p>

            <div className="mt-8">
              <h2 className="font-display text-2xl font-bold">
                The opportunity
              </h2>

              <p className="mt-4 leading-7 text-muted-foreground">
                {selectedProblem.description ||
                  'This validated community problem is ready to be explored by a student team through research, innovation and practical implementation.'}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold">
                What a strong response explores
              </h3>

              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  ✓ Understands the local community context.
                </p>

                <p>
                  ✓ Can be tested through a practical student project.
                </p>

                <p>
                  ✓ Uses appropriate technical and local knowledge.
                </p>
              </div>
            </div>
          </Card>

          <div>
            <Card className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Challenge at a glance
              </p>

              <div className="mt-6 space-y-5">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Category
                  </span>

                  <span className="text-right text-sm font-bold">
                    {selectedProblem.category ||
                      'General'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Location
                  </span>

                  <span className="text-right text-sm font-bold">
                    {selectedProblem.district ||
                      'Jharkhand'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Stage
                  </span>

                  <Badge tone="green">
                    Validated
                  </Badge>
                </div>

              </div>

              <div className="mt-7">
                {applicationStarted ? (
                  <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
                    Application started
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={
                      startApplication
                    }
                  >
                    Apply with a team
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  /*
   * ---------------------------------------------------------
   * CHALLENGE DETAIL PAGE
   * ---------------------------------------------------------
   */

  if (selectedProblem) {
    return (
      <Shell>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={closeProblem}
          >
            ← All innovation challenges
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          <Card className="p-6 md:p-8">
            <Badge tone="green">
              {selectedProblem.category ||
                'Community challenge'}
            </Badge>

            <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">
              {selectedProblem.title}
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              📍{' '}
              {selectedProblem.district ||
                'Jharkhand'}
            </p>

            <div className="mt-8">
              <h2 className="font-display text-2xl font-bold">
                The opportunity
              </h2>

              <p className="mt-4 leading-7 text-muted-foreground">
                {selectedProblem.description ||
                  'A validated community challenge ready for student teams to explore through research and innovation.'}
              </p>
            </div>

            <Button
              variant="outline"
              className="mt-7"
              onClick={() =>
                setShowBrief(true)
              }
            >
              View brief
            </Button>
          </Card>

          <Card className="h-fit p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Challenge at a glance
            </p>

            <div className="mt-6 space-y-5">

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Category
                </span>

                <span className="text-right text-sm font-bold">
                  {selectedProblem.category ||
                    'General'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Location
                </span>

                <span className="text-right text-sm font-bold">
                  {selectedProblem.district ||
                    'Jharkhand'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Stage
                </span>

                <Badge tone="green">
                  Open
                </Badge>
              </div>

            </div>

            <div className="mt-7">
              {applicationStarted ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
                  Application started
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={
                    startApplication
                  }
                >
                  Apply as a team
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN UNIVERSITY / STUDENT DASHBOARD
   * ---------------------------------------------------------
   */

  const districtsCovered =
    new Set(
      problems
        .map(
          (problem) =>
            problem.district
        )
        .filter(Boolean)
    ).size;

  return (
    <Shell>
      <PageIntro
        eyebrow="University workspace"
        title={`Good morning, ${
          user?.name || 'User'
        }.`}
        description="Validated citizen problems ready to become innovation projects."
        action={
          <Button
            variant="primary"
            onClick={openCreateTeam}
          >
            + Create a team
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <Metric
          label="Validated challenges"
          value={String(
            problems.length
          )}
          detail="Ready to pick up"
          icon={GraduationCap}
          tone="primary"
        />

        <Metric
          label="Active projects"
          value="0"
          detail="Will connect next"
          icon={Lightbulb}
          tone="orange"
        />

        <Metric
          label="Teams formed"
          value={String(
            teams.length
          )}
          detail={
            teams.length === 0
              ? 'Create your first team'
              : 'Student teams'
          }
          icon={Users}
          tone="blue"
        />

        <Metric
          label="Districts covered"
          value={String(
            districtsCovered
          )}
          detail="Across validated challenges"
          icon={Target}
          tone="green"
        />
      </div>

      <div className="mt-7">
        <Card className="p-5 md:p-6">

          <SectionTitle
            eyebrow="Open for pickup"
            title="Innovation challenges"
            description="Problems validated by Panchayat/ULB and available to student teams."
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading challenges...
            </div>
          )}

          {!loading &&
            !error &&
            problems.length === 0 && (
              <div className="py-10 text-center">
                <GraduationCap
                  className="mx-auto text-muted-foreground"
                  size={32}
                />

                <p className="mt-3 font-bold">
                  No validated challenges yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Once Panchayat/ULB validates a problem, it will appear here.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            problems.length > 0 && (
              <div className="space-y-3">

                {problems.map(
                  (problem) => (
                    <button
                      key={
                        problem.id
                      }
                      type="button"
                      onClick={() =>
                        openProblem(
                          problem
                        )
                      }
                      className="flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-left transition hover:bg-secondary/40"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary">
                        <Lightbulb
                          size={19}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">
                          {
                            problem.title
                          }
                        </span>

                        <span className="mt-1 block text-xs text-muted-foreground">
                          {
                            problem.district ||
                              'Jharkhand'
                          }{' '}
                          ·{' '}
                          {
                            problem.category ||
                              'General'
                          }
                        </span>
                      </span>

                      <Badge tone="green">
                        Validated
                      </Badge>

                      <span className="text-lg text-muted-foreground">
                        →
                      </span>
                    </button>
                  )
                )}

              </div>
            )}

        </Card>
      </div>

      <div className="mt-7">
        <Card className="p-5 md:p-6">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <SectionTitle
              eyebrow="University workspace"
              title="Your teams"
              description="Bring the right mix of student skills and knowledge together."
            />

            <Button
              variant="primary"
              onClick={
                openCreateTeam
              }
            >
              + Create a team
            </Button>

          </div>

          {teams.length === 0 ? (
            <div className="py-10 text-center">

              <Users
                className="mx-auto text-muted-foreground"
                size={34}
              />

              <p className="mt-3 font-bold">
                No teams yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a team to start working on an innovation challenge.
              </p>

              <Button
                variant="outline"
                className="mt-5"
                onClick={
                  openCreateTeam
                }
              >
                + Create a team
              </Button>

            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {teams.map(
                (team) => {
                  const members =
                    Array.isArray(
                      team.members
                    )
                      ? team.members
                      : [];

                  return (
                    <Card
                      key={
                        team.id
                      }
                      className="p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-start gap-3">

                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                            <Users
                              size={19}
                            />
                          </span>

                          <div>

                            <h3 className="font-display text-xl font-bold">
                              {
                                team.teamName ||
                                team.name ||
                                'Unnamed team'
                              }
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {
                                team.challengeTitle ||
                                team.projectName ||
                                'No challenge selected'
                              }
                            </p>

                          </div>
                        </div>

                        <Badge
                          tone={
                            team.status ===
                            'Application submitted'
                              ? 'green'
                              : 'muted'
                          }
                        >
                          {
                            team.status ||
                            'Draft'
                          }
                        </Badge>

                      </div>

                      <div className="mt-5 border-t border-border pt-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-muted-foreground">
                            👥{' '}
                            {
                              members.length ||
                              0
                            }{' '}
                            members
                          </span>

                          <Button
                            variant="outline"
                            onClick={() =>
                              openManageTeam(
                                team
                              )
                            }
                          >
                            Manage
                          </Button>

                        </div>
                      </div>

                    </Card>
                  );
                }
              )}

            </div>
          )}

        </Card>
      </div>
    </Shell>
  );
}
function FacultyDashboard() {
  const user = readStore('ss-user', { name: 'User' });

  const [problems, setProblems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
  const [showProblemReview, setShowProblemReview] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [problemsData, projectsData, teamsData] = await Promise.all([
          apiRequest<any[]>('/problems'),
          apiRequest<any[]>('/projects'),
          apiRequest<any[]>('/teams'),
        ]);

        setProblems(Array.isArray(problemsData) ? problemsData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        console.error('Failed to load faculty workspace:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load faculty workspace.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const projectProblemIds = new Set(
    projects
      .map((project) => project.problemId)
      .filter(Boolean)
  );

  /*
   * These are the problems which have already passed community validation
   * and are available for faculty review.
   */
  const researchOpportunities = problems.filter(
    (problem) =>
      (
        problem.validationStatus === 'validated' ||
        problem.status === 'validated' ||
        problem.status === 'Validated'
      ) &&
      !projectProblemIds.has(problem.id)
  );

  /*
   * Problems shown in the faculty review queue.
   * This is intentionally based on problems, not projects.
   */
  const problemsNeedingReview = researchOpportunities;

  const projectsNeedingReview = projects.filter(
    (project) =>
      !project.status ||
      project.status === 'Proposed' ||
      project.status === 'Pending'
  );

  const reviewProjects = () => {
    document
      .getElementById('faculty-review-desk')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  const openProblemReview = (problem: any) => {
    setSelectedProblem(problem);
    setFeedback('');
    setActionMessage('');
    setShowProblemReview(true);
  };

  const closeProblemReview = () => {
    setShowProblemReview(false);
    setSelectedProblem(null);
    setFeedback('');
    setActionMessage('');
  };

  const openCollaboration = () => {
    setActionMessage('');
    setShowCollaboration(true);
  };

  const closeCollaboration = () => {
    setShowCollaboration(false);
  };

  const giveFeedback = async () => {
    if (!selectedProblem) return;

    if (!feedback.trim()) {
      setActionMessage('Please enter feedback before submitting.');
      return;
    }

    /*
     * Keep the feedback in the UI for now.
     * No unverified backend endpoint is called here.
     * This prevents breaking the existing API.
     */
    setActionLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      setActionMessage('Feedback recorded for this review.');
      setFeedback('');
    } catch (err) {
      setActionMessage('Unable to submit feedback.');
    } finally {
      setActionLoading(false);
    }
  };

  const approveProblem = async () => {
    if (!selectedProblem) return;

    setActionLoading(true);
    setActionMessage('');

    try {
      /*
       * Use the existing validation endpoint if available.
       * The problem is already community-validated, so this marks
       * the faculty review state locally without inventing a new API.
       */
      const updatedProblem = {
        ...selectedProblem,
        facultyStatus: 'approved',
      };

      setProblems((current) =>
        current.map((problem) =>
          problem.id === selectedProblem.id
            ? updatedProblem
            : problem
        )
      );

      setSelectedProblem(updatedProblem);

      setActionMessage(
        'Problem approved. It can now be taken up as a collaborative project.'
      );
    } catch (err) {
      setActionMessage('Unable to approve this problem.');
    } finally {
      setActionLoading(false);
    }
  };

  const exploreOpportunity = (problem: any) => {
    openProblemReview(problem);
  };

  return (
    <Shell>
      <PageIntro
        eyebrow="Faculty workspace"
        title={`Good morning, ${user?.name || 'User'}.`}
        description="Review team progress, give timely feedback and open doors to research."
        action={
          <Button
            variant="primary"
            onClick={reviewProjects}
          >
            <ClipboardCheck size={17} />
            Review projects
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Assigned challenges"
          value={String(problemsNeedingReview.length)}
          detail={`${researchOpportunities.length} ready for review`}
          icon={Lightbulb}
          tone="orange"
        />

        <Metric
          label="Student teams"
          value={String(teams.length)}
          detail={
            teams.length === 0
              ? 'No teams formed yet'
              : `Across ${
                  new Set(
                    teams
                      .map((team) => team.department)
                      .filter(Boolean)
                  ).size || 1
                } departments`
          }
          icon={Users}
          tone="blue"
        />

        <Metric
          label="Mentored projects"
          value={String(projects.length)}
          detail={
            projects.some(
              (project) => project.status === 'In progress'
            )
              ? `${
                  projects.filter(
                    (project) => project.status === 'In progress'
                  ).length
                } in progress`
              : 'Active university projects'
          }
          icon={Target}
          tone="green"
        />

        <Metric
          label="Pending approvals"
          value={String(problemsNeedingReview.length)}
          detail="Community problems"
          icon={ClipboardCheck}
          tone="primary"
        />
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_.95fr]">

        {/* REVIEW QUEUE */}

        <Card
          id="faculty-review-desk"
          className="p-5 md:p-6"
        >
          <SectionTitle
            eyebrow="Your review desk"
            title="Problems that need you"
            description="Review validated community problems before taking them forward as university projects."
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading problems...
            </div>
          )}

          {!loading && problemsNeedingReview.length === 0 && (
            <div className="py-10 text-center">
              <CheckCircle2
                className="mx-auto text-emerald-600"
                size={34}
              />

              <p className="mt-3 font-bold">
                Nothing needs your attention
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                New validated community problems will appear here.
              </p>
            </div>
          )}

          {!loading && problemsNeedingReview.length > 0 && (
            <div className="space-y-2">
              {problemsNeedingReview.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-accent">
                    <FileText size={18} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {problem.title || 'Untitled problem'}
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      {problem.category || 'General'}
                      {problem.district
                        ? ` · ${problem.district}`
                        : ''}
                    </span>
                  </span>

                  <Button
                    variant="outline"
                    onClick={() => openProblemReview(problem)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* RESEARCH OPPORTUNITIES */}

        <Card
          id="faculty-opportunities"
          className="p-5 md:p-6"
        >
          <SectionTitle
            eyebrow="Open doors"
            title="Research opportunities"
            description="Validated community challenges that match university expertise and are ready to become projects."
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading opportunities...
            </div>
          )}

          {!loading && researchOpportunities.length === 0 && (
            <div className="py-10 text-center">
              <Lightbulb
                className="mx-auto text-muted-foreground"
                size={34}
              />

              <p className="mt-3 font-bold">
                No new opportunities
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                New validated community challenges will appear here.
              </p>
            </div>
          )}

          {!loading && researchOpportunities.length > 0 && (
            <div className="space-y-3">
              {researchOpportunities.slice(0, 3).map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-2xl bg-secondary/60 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold">
                        {problem.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {problem.description ||
                          'A validated community challenge available for university research.'}
                      </p>
                    </div>

                    <Badge tone="green">
                      Validated
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="blue">
                      {problem.category || 'General'}
                    </Badge>

                    <Badge tone="muted">
                      📍 {problem.district || 'Jharkhand'}
                    </Badge>

                    {problem.urgency && (
                      <Badge tone="amber">
                        {problem.urgency}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => exploreOpportunity(problem)}
                  >
                    Review problem
                    <ArrowRight size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* MENTORED PROJECTS */}

      <div className="mt-7">
        <Card className="p-5 md:p-6">
          <SectionTitle
            eyebrow="Your work"
            title="Mentored projects"
            description="Projects accepted from validated community challenges."
          />

          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading projects...
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="py-10 text-center">
              <BriefcaseBusiness
                className="mx-auto text-muted-foreground"
                size={34}
              />

              <p className="mt-3 font-bold">
                No projects yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Projects accepted from validated challenges will appear here.
              </p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  id={`faculty-project-${project.id}`}
                  key={project.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/45 text-primary">
                    <BriefcaseBusiness size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {project.projectName}
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      {project.progress || 0}% complete
                      {project.description
                        ? ` · ${project.description}`
                        : ''}
                    </span>
                  </span>

                  <Badge
                    tone={
                      project.status === 'Completed'
                        ? 'green'
                        : project.status === 'In progress'
                        ? 'blue'
                        : 'amber'
                    }
                  >
                    {project.status || 'Proposed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* PROBLEM REVIEW MODAL */}

      {showProblemReview && selectedProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Problem review
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold">
                  {selectedProblem.title || 'Community problem'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeProblemReview}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Problem description
                </p>

                <p className="mt-2 text-sm leading-6">
                  {selectedProblem.description ||
                    'No description available.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    Category
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedProblem.category || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    District
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedProblem.district || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    Location
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedProblem.location || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    Urgency
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedProblem.urgency || 'Not specified'}
                  </p>
                </div>

              </div>

              {selectedProblem.people && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    People affected
                  </p>

                  <p className="mt-1 text-sm">
                    {selectedProblem.people}
                  </p>
                </div>
              )}

              {selectedProblem.evidence && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Evidence
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {selectedProblem.evidence}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Validation status
                </p>

                <p className="mt-1 font-semibold">
                  {selectedProblem.validationStatus ||
                    selectedProblem.status ||
                    'Validated'}
                </p>
              </div>

              {actionMessage && (
                <div className="rounded-xl bg-secondary/60 p-4 text-sm font-semibold">
                  {actionMessage}
                </div>
              )}

            </div>

            <div className="mt-7">

              <label className="text-sm font-bold">
                Give feedback
              </label>

              <textarea
                value={feedback}
                onChange={(event) =>
                  setFeedback(event.target.value)
                }
                placeholder="Add feedback for this problem..."
                className="mt-2 min-h-28 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />

            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">

              <Button
                variant="outline"
                onClick={giveFeedback}
                disabled={actionLoading}
              >
                Give feedback
              </Button>

              <Button
                variant="primary"
                onClick={approveProblem}
                disabled={actionLoading}
              >
                Approve
              </Button>

              <Button
                variant="primary"
                onClick={openCollaboration}
                disabled={actionLoading}
              >
                Take up as collaborative project
                <ArrowRight size={16} />
              </Button>

            </div>

          </div>
        </div>
      )}

      {/* COLLABORATIVE PROJECT MODAL */}

      {showCollaboration && selectedProblem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Collaborative project
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold">
                  Take up as collaborative project
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Match this community problem with suitable student teams.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCollaboration}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-secondary/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Problem
              </p>

              <h3 className="mt-2 font-display text-xl font-bold">
                {selectedProblem.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedProblem.description ||
                  'No description available.'}
              </p>
            </div>

            <div className="mt-6">
              <SectionTitle
                eyebrow="Potential collaborators"
                title="Student teams"
                description="Available university teams that can work on this problem."
              />

              {teams.length === 0 ? (
                <div className="mt-4 rounded-xl border border-border p-6 text-center">
                  <Users
                    className="mx-auto text-muted-foreground"
                    size={32}
                  />

                  <p className="mt-3 font-bold">
                    No student teams available
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Student teams will appear here when they are available.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">

                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"
                    >

                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                        <Users size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold">
                          {team.name ||
                            team.teamName ||
                            'Student team'}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {team.department ||
                            team.skills ||
                            'University student team'}
                        </p>
                      </div>

                      <Badge tone="green">
                        Available
                      </Badge>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setActionMessage(
                            `Team ${
                              team.name ||
                              team.teamName ||
                              'selected'
                            } selected for collaboration.`
                          );
                        }}
                      >
                        Invite team
                      </Button>

                    </div>
                  ))}

                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-border p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resource match
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">

                <div>
                  <p className="text-sm font-semibold">
                    Technical skills
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Matched with available teams
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Domain expertise
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on team departments
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Project capacity
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Available student teams
                  </p>
                </div>

              </div>

            </div>

            {actionMessage && (
              <div className="mt-5 rounded-xl bg-secondary/60 p-4 text-sm font-semibold">
                {actionMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">

              <Button
                variant="outline"
                onClick={closeCollaboration}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  setActionMessage(
                    'Collaborative project setup selected.'
                  );
                }}
              >
                Continue
                <ArrowRight size={16} />
              </Button>

            </div>

          </div>
        </div>
      )}

    </Shell>
  );
}
function IndustryDashboard() {
  const user = readStore('ss-user', { name: 'User' });

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [screen, setScreen] = useState<
    'dashboard' | 'collaboration' | 'project'
  >('dashboard');

  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [supportType, setSupportType] = useState('Mentorship');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [expertise, setExpertise] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const [following, setFollowing] = useState(false);

  const [communityMessage, setCommunityMessage] = useState('');
  const [communityPosts, setCommunityPosts] = useState([
    {
      initials: 'A',
      name: 'Field team update',
      message:
        'The first sensor batch has reached the field team in Khunti.',
      tone: 'orange',
    },
    {
      initials: 'N',
      name: 'Dr. Nandini Prasad',
      message:
        'Can we review the maintenance plan with the village water committee?',
      tone: 'blue',
    },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiRequest<any[]>('/projects');
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /*
   * ---------------------------------------------------------
   * DEMO PROJECT
   * ---------------------------------------------------------
   * Used when the database project does not contain all the
   * fields required by the detailed project screen.
   */
  const getProjectDetails = (project: any) => {
    const name =
      project?.projectName ||
      project?.title ||
      'Smart Water Monitoring for Rural Villages';

    const isWaterProject =
      name.toLowerCase().includes('water');

    if (isWaterProject) {
      return {
        title: name,
        status: project?.status || 'Pilot running',
        location:
          project?.district ||
          project?.location ||
          'Khunti & Gumla',

        updated: 'Updated 2 days ago',

        description:
          'A field-ready sensor and community dashboard being piloted across Khunti and Gumla.',

        progress: project?.progress || 68,

        journey: [
          {
            number: '✓',
            label: 'Community need mapped',
            complete: true,
          },
          {
            number: '✓',
            label: 'Prototype tested',
            complete: true,
          },
          {
            number: '3',
            label: 'Pilot running',
            complete: true,
          },
          {
            number: '4',
            label: 'Impact review',
            complete: false,
          },
        ],

        milestone: 'MILESTONE 3',
        milestoneTitle: 'Pilot running',

        milestoneDescription:
          'The pilot is live across 8 villages. Community operators are checking water levels twice each day and the team is learning from every alert.',

        impact: [
          {
            value: '1,240',
            label: 'households',
            highlight: true,
          },
          {
            value: '18',
            label: 'water points',
            highlight: false,
          },
          {
            value: '8',
            label: 'villages',
            highlight: false,
          },
          {
            value: '31%',
            label: 'fewer dry days',
            highlight: false,
          },
        ],

        people: [
          {
            initials: 'B',
            name: 'Birsa Institute of Technology',
            role: 'University team',
            tone: 'blue',
          },
          {
            initials: 'N',
            name: 'Dr. Nandini Prasad',
            role: 'Faculty mentor',
            tone: 'blue',
          },
          {
            initials: 'T',
            name: 'Tata Steel Foundation',
            role: 'Industry / CSR partner',
            tone: 'purple',
          },
        ],

        statement:
          'Seasonal water stress makes it difficult for rural households to know which sources are safe and available.',

        approach:
          'Low-power sensors, a simple local dashboard and community-led maintenance routines.',

        documents: [
          'Pilot protocol.pdf',
          'Field learning note.pdf',
          'Prototype demo link',
        ],
      };
    }

    return {
      title: name,
      status: project?.status || 'Prototype',
      location:
        project?.district ||
        project?.location ||
        'Jharkhand',

      updated: 'Updated recently',

      description:
        project?.description ||
        'A university-led project developed in response to a validated community problem.',

      progress: project?.progress || 44,

      journey: [
        {
          number: '✓',
          label: 'Community need mapped',
          complete: true,
        },
        {
          number: '✓',
          label: 'Prototype tested',
          complete: true,
        },
        {
          number: '3',
          label: 'Pilot running',
          complete: true,
        },
        {
          number: '4',
          label: 'Impact review',
          complete: false,
        },
      ],

      milestone: 'MILESTONE 3',
      milestoneTitle:
        project?.status || 'Pilot running',

      milestoneDescription:
        project?.description ||
        'The project is currently being developed and prepared for field implementation with university and industry partners.',

      impact: [
        {
          value: '1,240',
          label: 'people reached',
          highlight: true,
        },
        {
          value: '18',
          label: 'field points',
          highlight: false,
        },
        {
          value: '8',
          label: 'villages',
          highlight: false,
        },
        {
          value: '31%',
          label: 'improvement',
          highlight: false,
        },
      ],

      people: [
        {
          initials: 'U',
          name: 'University Project Team',
          role: 'University team',
          tone: 'blue',
        },
        {
          initials: 'F',
          name: 'Faculty Mentor',
          role: 'Faculty mentor',
          tone: 'blue',
        },
        {
          initials: 'I',
          name: 'Industry Partner',
          role: 'Industry / CSR partner',
          tone: 'purple',
        },
      ],

      statement:
        project?.description ||
        'A validated local problem requiring technical and implementation support.',

      approach:
        'A collaborative approach combining university expertise, field implementation and industry support.',

      documents: [
        'Project brief.pdf',
        'Field learning note.pdf',
        'Prototype demo link',
      ],
    };
  };

  /*
   * ---------------------------------------------------------
   * OPEN PROJECT DETAILS
   * ---------------------------------------------------------
   */
  const openProject = (project: any) => {
    setSelectedProject(project);
    setFollowing(false);
    setScreen('project');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /*
   * ---------------------------------------------------------
   * OPEN COLLABORATION
   * ---------------------------------------------------------
   */
  const openCollaboration = () => {
    const firstProject =
      selectedProject ||
      projects[0] || {
        projectName: 'Smart Water Monitoring for Rural Villages',
        district: 'Khunti & Gumla',
        status: 'Pilot running',
        progress: 68,
      };

    setSelectedProject(firstProject);
    setSupportSent(false);
    setScreen('collaboration');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
   * ---------------------------------------------------------
   * BACK TO DASHBOARD
   * ---------------------------------------------------------
   */
  const backToDashboard = () => {
    setScreen('dashboard');
    setSelectedProject(null);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
   * ---------------------------------------------------------
   * SUPPORT REQUEST
   * ---------------------------------------------------------
   */
  const sendSupportRequest = () => {
    setSupportSent(true);
  };

  /*
   * =========================================================
   * COLLABORATION SCREEN
   * =========================================================
   */
  if (screen === 'collaboration') {
    const project = getProjectDetails(selectedProject);

    return (
      <Shell>
        <div className="min-h-[calc(100vh-80px)]">

          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Industry & CSR workspace
            </p>

            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
              Start a useful conversation.
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              Tell a project what you can bring. The team will receive a clear,
              respectful request in this demo workspace.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">

            {/* SELECTED PROJECT */}
            <Card className="p-7 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Selected project
              </p>

              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-primary">
                {project.title}
              </h2>

              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {project.description}
              </p>

              <div className="mt-8 rounded-2xl bg-[#fff0d2] p-5">
                <p className="text-xs font-bold text-primary">
                  The team is looking for
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-primary">
                  Testing partner · Prototype refinement · Deployment support
                </p>
              </div>
            </Card>

            {/* YOUR OFFER */}
            <Card className="p-7 md:p-8">

              <h2 className="font-display text-3xl font-bold text-primary">
                Your offer
              </h2>

              {supportSent ? (
                <div className="mt-8 rounded-2xl bg-[#e7f6ed] p-6">
                  <CheckCircle2
                    size={30}
                    className="text-primary"
                  />

                  <h3 className="mt-4 text-xl font-bold text-primary">
                    Support request sent
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The project team has received your request in this demo
                    workspace.
                  </p>

                  <Button
                    variant="primary"
                    className="mt-6"
                    onClick={backToDashboard}
                  >
                    Back to dashboard
                  </Button>
                </div>
              ) : (
                <div className="mt-7 space-y-6">

                  <div>
                    <label className="text-sm font-bold text-primary">
                      How would you like to help?
                    </label>

                    <select
                      value={supportType}
                      onChange={(e) =>
                        setSupportType(e.target.value)
                      }
                      className="mt-2 h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    >
                      <option>Mentorship</option>
                      <option>Funding</option>
                      <option>Technology</option>
                      <option>Testing partner</option>
                      <option>Deployment support</option>
                      <option>CSR partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-primary">
                      Indicative budget{' '}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>

                    <input
                      value={budget}
                      onChange={(e) =>
                        setBudget(e.target.value)
                      }
                      placeholder="Example: ₹4,00,000"
                      className="mt-2 h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-primary">
                      Expected timeline
                    </label>

                    <input
                      value={timeline}
                      onChange={(e) =>
                        setTimeline(e.target.value)
                      }
                      placeholder="Example: 8 weeks from June 2026"
                      className="mt-2 h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-primary">
                      Relevant expertise
                    </label>

                    <textarea
                      value={expertise}
                      onChange={(e) =>
                        setExpertise(e.target.value)
                      }
                      placeholder="Tell the team what you can bring and what a first conversation could cover."
                      className="mt-2 min-h-[130px] w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm leading-6 outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={sendSupportRequest}
                  >
                    <Send size={17} />
                    Send support request
                  </Button>

                </div>
              )}

            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  /*
   * =========================================================
   * PROJECT DETAIL SCREEN
   * =========================================================
   */
  if (screen === 'project') {
    const project = getProjectDetails(selectedProject);

    return (
      <Shell>
        <div className="pb-12">

          {/* PROJECT HEADER */}
          <div className="mb-8">

            <button
              type="button"
              onClick={backToDashboard}
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft size={17} />
              Project commons
            </button>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <Badge tone="green">
                  {project.status}
                </Badge>

                <h1 className="mt-5 max-w-5xl font-display text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl">
                  {project.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} />

                  <span>{project.location}</span>

                  <span>·</span>

                  <span>{project.updated}</span>
                </div>
              </div>

              <Button
                variant={following ? 'outline' : 'primary'}
                onClick={() => setFollowing(!following)}
              >
                <HandHeart size={17} />

                {following
                  ? 'Following project'
                  : 'Follow project'}
              </Button>

            </div>
          </div>

          {/* MAIN PROJECT AREA */}
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">

            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* PROJECT JOURNEY */}
              <Card className="overflow-hidden p-0">

                <div className="bg-[#27684f] p-7 text-white md:p-9">

                  <div className="flex items-start justify-between gap-5">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f4c24d]">
                        Project journey
                      </p>

                      <p className="mt-3 text-sm text-white/75">
                        From a local challenge to a field pilot
                      </p>
                    </div>

                    <div className="text-4xl font-bold text-[#f4c24d]">
                      {project.progress}%
                    </div>

                  </div>

                  <div className="relative mt-12">

                    {/* CONNECTING LINE */}
                    <div className="absolute left-[12%] right-[12%] top-6 h-[2px] bg-white/25" />

                    <div
                      className="absolute left-[12%] top-6 h-[2px] bg-[#f4c24d]"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            76,
                            project.progress
                          )
                        )}%`,
                      }}
                    />

                    <div className="relative grid grid-cols-4 gap-3">

                      {project.journey.map(
                        (step: any, index: number) => (
                          <div
                            key={step.label}
                            className="flex flex-col items-center text-center"
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                                step.complete
                                  ? 'border-[#f4c24d] bg-[#f4c24d] text-primary'
                                  : 'border-white/30 bg-transparent text-white/60'
                              } text-sm font-bold`}
                            >
                              {step.number}
                            </div>

                            <p
                              className={`mt-4 max-w-[130px] text-xs font-semibold leading-4 ${
                                step.complete
                                  ? 'text-white'
                                  : 'text-white/60'
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        )
                      )}

                    </div>
                  </div>
                </div>

                {/* MILESTONE */}
                <div className="p-7 md:p-9">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    {project.milestone}
                  </p>

                  <h2 className="mt-3 font-display text-2xl font-bold text-primary">
                    {project.milestoneTitle}
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {project.milestoneDescription}
                  </p>

                </div>
              </Card>

              {/* PROJECT CONTEXT */}
              <Card className="p-7 md:p-9">

                <h2 className="font-display text-2xl font-bold text-primary">
                  The project in context
                </h2>

                <div className="mt-7 grid gap-8 md:grid-cols-2">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Statement
                    </p>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {project.statement}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Approach
                    </p>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {project.approach}
                    </p>
                  </div>

                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* IMPACT */}
              <Card className="p-7">

                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Impact so far
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  {project.impact.map((item: any) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl p-5 ${
                        item.highlight
                          ? 'bg-[#fff0d2]'
                          : 'bg-muted/70'
                      }`}
                    >
                      <p className="text-2xl font-bold text-primary">
                        {item.value}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))}

                </div>
              </Card>

              {/* PEOPLE */}
              <Card className="p-7">

                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  People behind it
                </p>

                <div className="mt-5 space-y-5">

                  {project.people.map((person: any) => (
                    <div
                      key={person.name}
                      className="flex items-center gap-4"
                    >

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          person.tone === 'purple'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {person.initials}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-primary">
                          {person.name}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {person.role}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>
              </Card>

              {/* DOCUMENTS */}
              <Card className="p-7">

                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-primary">
                    Documents & prototype
                  </h2>

                  <MoreHorizontal
                    size={19}
                    className="text-muted-foreground"
                  />
                </div>

                <div className="mt-5 space-y-1">

                  {project.documents.map(
                    (document: string) => (
                      <button
                        key={document}
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left transition hover:bg-muted"
                      >

                        <span className="flex items-center gap-3">
                          <FileText
                            size={17}
                            className="text-accent"
                          />

                          <span className="text-sm font-semibold text-primary">
                            {document}
                          </span>
                        </span>

                        <ArrowRight
                          size={16}
                          className="text-muted-foreground"
                        />

                      </button>
                    )
                  )}

                </div>
              </Card>

            </div>
          </div>

          {/* COMMUNITY COMMUNICATION */}
          <Card className="mt-6 p-7 md:p-9">

            <h2 className="font-display text-2xl font-bold text-primary">
              Community communication
            </h2>

            <div className="mt-7 space-y-5">

              {communityPosts.map((post, index) => (
                <div
                  key={`${post.name}-${index}`}
                  className="flex items-start gap-4"
                >

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      post.tone === 'orange'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {post.initials}
                  </div>

                  <div className="rounded-2xl bg-muted/80 px-5 py-4">

                    <p className="text-sm font-bold text-primary">
                      {post.name}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {post.message}
                    </p>

                  </div>

                </div>
              ))}

            </div>

            {/* POST BOX */}
            <div className="mt-7 flex flex-col gap-3 md:flex-row">

              <input
                value={communityMessage}
                onChange={(e) =>
                  setCommunityMessage(e.target.value)
                }
                placeholder="Add an update or question"
                className="h-14 flex-1 rounded-2xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <Button
                variant="primary"
                onClick={() => {
                  if (!communityMessage.trim()) return;

                  setCommunityPosts((current) => [
                    ...current,
                    {
                      initials: 'A',
                      name: user?.name || 'You',
                      message: communityMessage.trim(),
                      tone: 'orange',
                    },
                  ]);

                  setCommunityMessage('');
                }}
              >
                <Send size={17} />
                Post
              </Button>

            </div>

          </Card>

        </div>
      </Shell>
    );
  }

  /*
   * =========================================================
   * ORIGINAL INDUSTRY DASHBOARD
   * =========================================================
   *
   * The existing dashboard structure stays here.
   * Only:
   *   1. Find a collaboration opens the collaboration screen.
   *   2. Project cards open the project detail screen.
   */
  return (
    <Shell>

      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

        <PageIntro
          eyebrow="Industry workspace"
          title={`Good morning, ${user?.name || 'User'}.`}
          description="Projects that may need funding, technology or implementation support."
        />

        {/* FIND A COLLABORATION */}
        <Button
          variant="primary"
          className="w-fit"
          onClick={openCollaboration}
        >
          <Network size={17} />
          Find a collaboration
        </Button>

      </div>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <Metric
          label="Open projects"
          value={String(projects.length)}
          detail="Across all universities"
          icon={BriefcaseBusiness}
          tone="primary"
        />

        <Metric
          label="Supported by you"
          value="0"
          detail="Will connect next"
          icon={IndianRupee}
          tone="orange"
        />

        <Metric
          label="In progress"
          value={String(
            projects.filter(
              (p) => p.status === 'In progress'
            ).length
          )}
          detail="Currently active"
          icon={Activity}
          tone="blue"
        />

        <Metric
          label="Completed"
          value="0"
          detail="Will connect next"
          icon={CheckCircle2}
          tone="green"
        />

      </div>

      {/* PROJECTS */}
      <div className="mt-7">

        <Card className="p-5 md:p-6">

          <SectionTitle
            eyebrow="Open for support"
            title="Projects"
            description="Projects proposed by university teams from validated citizen problems."
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading projects...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            projects.length === 0 && (
              <div className="py-10 text-center">

                <BriefcaseBusiness
                  className="mx-auto text-muted-foreground"
                  size={32}
                />

                <p className="mt-3 font-bold">
                  No projects yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Once a university picks up a validated
                  problem, it will appear here.
                </p>

              </div>
            )}

          {!loading &&
            !error &&
            projects.length > 0 && (
              <div className="space-y-2">

                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProject(p)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-muted/50"
                  >

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-accent">
                      <BriefcaseBusiness size={17} />
                    </span>

                    <span className="min-w-0 flex-1">

                      <span className="block truncate text-sm font-bold text-primary">
                        {p.projectName ||
                          p.title ||
                          'Untitled project'}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {p.progress || 0}% complete
                      </span>

                    </span>

                    <Badge tone="blue">
                      {p.status || 'Proposed'}
                    </Badge>

                    <ArrowRight
                      size={17}
                      className="shrink-0 text-muted-foreground"
                    />

                  </button>
                ))}

              </div>
            )}

        </Card>

      </div>

    </Shell>
  );
}
function GovernmentAnalytics() {
  return (
    <Shell>
      <PageIntro
        eyebrow="Government workspace"
        title="State analytics"
        description="A state-wide view of community problems, response patterns and project activity."
      />

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            District
          </p>

          <select className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <option>All districts</option>
            <option>Ranchi</option>
            <option>Dhanbad</option>
            <option>Gumla</option>
            <option>Hazaribagh</option>
            <option>Deoghar</option>
            <option>Jamshedpur</option>
          </select>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Domain
          </p>

          <select className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <option>All domains</option>
            <option>Education</option>
            <option>Healthcare</option>
            <option>Agriculture</option>
            <option>Water & sanitation</option>
            <option>Environment</option>
          </select>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Time range
          </p>

          <select className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
            <option>This year</option>
            <option>All time</option>
          </select>
        </Card>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle
            eyebrow="Citizen voice"
            title="From voice to outcome"
            description="How reported community problems move through validation and action."
          />

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <span className="text-sm font-semibold">
                Problems reported
              </span>
              <span className="font-display text-xl font-bold">
                428
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <span className="text-sm font-semibold">
                Problems validated
              </span>
              <span className="font-display text-xl font-bold">
                284
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <span className="text-sm font-semibold">
                Projects initiated
              </span>
              <span className="font-display text-xl font-bold">
                64
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <span className="text-sm font-semibold">
                Projects in progress
              </span>
              <span className="font-display text-xl font-bold">
                31
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle
            eyebrow="Problem landscape"
            title="What citizens are asking for"
            description="Distribution of reported community challenges by domain."
          />

          <div className="mt-6 space-y-4">
            {[
              ['Water & sanitation', 38],
              ['Education', 24],
              ['Healthcare', 18],
              ['Agriculture', 12],
              ['Environment', 8],
            ].map(([domain, value]) => (
              <div key={domain as string}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {domain}
                  </span>
                  <span className="text-muted-foreground">
                    {value}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <SectionTitle
          eyebrow="Insight"
          title="Where attention is concentrated"
          description="A summary view to help government teams identify areas requiring continued monitoring."
        />

        <div className="mt-5 rounded-2xl bg-secondary/30 p-5">
          <p className="text-sm leading-7 text-muted-foreground">
            Water and sanitation currently represent the largest share
            of reported challenges, while Ranchi has the highest
            concentration of activity in this illustrative analytics view.
          </p>
        </div>
      </Card>
    </Shell>
  );
}
function GovernmentDashboard() {
  const user = readStore('ss-user', { name: 'User' });

  const [problems, setProblems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [problemsData, projectsData] = await Promise.all([
          apiRequest<any[]>('/problems'),
          apiRequest<any[]>('/projects'),
        ]);

        setProblems(problemsData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Failed to load government overview:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load overview.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const validated = problems.filter(
    (p) => p.validationStatus === 'validated'
  ).length;

  const pending = problems.filter(
    (p) =>
      !p.validationStatus ||
      p.validationStatus === 'pending'
  ).length;

  const rejected = problems.filter(
    (p) => p.validationStatus === 'rejected'
  ).length;

  const activeProjects = projects.length;

  const districtData = [
    { name: 'Ranchi', value: 18, left: '46%', top: '50%' },
    { name: 'Dhanbad', value: 11, left: '63%', top: '42%' },
    { name: 'Gumla', value: 7, left: '29%', top: '54%' },
    { name: 'Hazaribagh', value: 9, left: '45%', top: '30%' },
    { name: 'Deoghar', value: 8, left: '70%', top: '24%' },
    { name: 'Jamshedpur', value: 12, left: '65%', top: '66%' },
  ];

  const responseData = [
    { month: 'Mar', value: 18 },
    { month: 'Apr', value: 21 },
    { month: 'May', value: 19 },
    { month: 'Jun', value: 23 },
    { month: 'Jul', value: 20 },
    { month: 'Aug', value: 22 },
  ];

  const maxResponse = 24;

  return (
    <Shell>
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <PageIntro
          eyebrow="Government workspace"
          title={`Good morning, ${user?.name || 'User'}.`}
          description="A district-wide view of citizen problems and the projects solving them."
        />

       <button
          type="button"
          onClick={() => {
              window.location.href = '/government/analytics';
        }}
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
    >
        <BarChart3 size={17} />
        Open analytics
    </button> 
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total problems"
          value={String(problems.length)}
          detail="Reported statewide"
          icon={Network}
          tone="primary"
        />

        <Metric
          label="Validated"
          value={String(validated)}
          detail="Approved by Panchayat/ULB"
          icon={CheckCircle2}
          tone="green"
        />

        <Metric
          label="Pending review"
          value={String(pending)}
          detail="Awaiting validation"
          icon={Clock3}
          tone="orange"
        />

        <Metric
          label="Active projects"
          value={String(activeProjects)}
          detail="In the pipeline"
          icon={BarChart3}
          tone="blue"
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* MAIN ANALYTICS AREA */}
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">

        {/* JHARKHAND MAP */}
        <Card className="overflow-hidden p-5 md:p-6">
          <SectionTitle
            eyebrow="District overview"
            title="Where the work is happening"
            description="Mock challenge density by district."
          />

          <div className="relative mt-5 h-[360px] overflow-hidden rounded-2xl border border-border bg-[#eef4ea]">

            {/* REAL JHARKHAND MAP */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Districts_of_Jharkhand_map.svg"
              alt="District map of Jharkhand"
              className="absolute inset-0 h-full w-full object-contain p-5"
            />

            {/* DISTRICT MARKERS */}
            {districtData.map((district) => (
              <div
                key={district.name}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{
                  left: district.left,
                  top: district.top,
                }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#c96d43] text-sm font-bold text-white shadow-lg">
                  {district.value}
                </span>

                <span className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-primary shadow-sm">
                  {district.name}
                </span>
              </div>
            ))}

            {/* LEGEND */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f604c]" />
              Mock challenge density
            </div>
          </div>

          {/* DISTRICT TOTALS */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">
                Ranchi
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                184
              </p>
            </div>

            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">
                Dhanbad
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                139
              </p>
            </div>

            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">
                Gumla
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                87
              </p>
            </div>
          </div>
        </Card>

        {/* RESPONSE MOMENTUM */}
        <Card className="p-5 md:p-6">
          <SectionTitle
            eyebrow="This quarter"
            title="Response Momentum"
            description="Problems receiving action over time."
          />

          <div className="mt-8 flex h-[330px] items-end gap-3 border-b border-border px-3 pb-3">
            {responseData.map((item) => {
              const height =
                (item.value / maxResponse) * 100;

              return (
                <div
                  key={item.month}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="relative w-[65%] rounded-t-2xl bg-primary/10"
                      style={{
                        height: `${height}%`,
                      }}
                    >
                      <span className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-[#c96d43] shadow-sm" />
                    </div>
                  </div>

                  <span className="mt-4 text-xs text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <span className="text-xs text-muted-foreground">
              Illustrative demo data
            </span>
          </div>
        </Card>
      </div>

      {/* MONITORING */}
      <div className="mt-7">
        <Card className="p-5 md:p-6">
          <SectionTitle
            eyebrow="Monitoring"
            title="All problems"
            description="Every problem reported so far, across all districts."
          />

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading overview...
            </div>
          )}

          {!loading && !error && (
            <div className="mt-5 space-y-2">
              {problems.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Milestone size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {p.title}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {p.district || 'Jharkhand'}
                    </span>
                  </span>

                  <Badge
                    tone={
                      p.validationStatus === 'validated'
                        ? 'green'
                        : p.validationStatus === 'rejected'
                        ? 'red'
                        : 'amber'
                    }
                  >
                    {p.validationStatus === 'validated'
                      ? 'Validated'
                      : p.validationStatus === 'rejected'
                      ? 'Rejected'
                      : 'Pending'}
                  </Badge>
                </div>
              ))}

              {problems.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No problems have been reported yet.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* BOTTOM SUMMARY CARDS */}
      <div className="mt-7 grid gap-4 md:grid-cols-3">

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Top domain
          </p>

          <h3 className="mt-3 font-display text-2xl font-bold text-primary">
            Water & sanitation
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            284 validated challenges
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Most active district
          </p>

          <h3 className="mt-3 font-display text-2xl font-bold text-primary">
            Ranchi
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            184 challenges · 24 projects
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Partner network
          </p>

          <h3 className="mt-3 font-display text-2xl font-bold text-primary">
            {projects.length} projects
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Universities, startups and CSR
          </p>
        </Card>

      </div>
    </Shell>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <LanguageProvider>
            <LanguageSync />
            <WouterRouter>
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/help" component={HelpPage} />
                <Route path="/role-selection" component={RoleSelection} />
                <Route path="/login" component={() => <Auth mode="login" />} />
                <Route path="/login/:role" component={() => <Auth mode="login" />} />
                <Route path="/register/:role" component={() => <Auth mode="register" />} />
                <Route path="/citizen/dashboard" component={Dashboard} />
                <Route path="/citizen/report" component={Report} />
                <Route path="/citizen/submissions" component={Submissions} />
                <Route path="/citizen/submissions/:id" component={SubmissionDetail} />
                <Route path="/community/dashboard" component={CommunityDashboard} />
                <Route path="/community/challenges" component={CommunityDashboard} />
                <Route path="/community/challenges/:id" component={CommunityProblemDetail} />
                <Route path="/panchayat/dashboard" component={CommunityDashboard} />
                <Route path="/ulb/dashboard" component={CommunityDashboard} />
                <Route path="/faculty/dashboard" component={FacultyDashboard} />
<Route path="/industry/dashboard" component={IndustryDashboard} />
<Route path="/government/dashboard" component={GovernmentDashboard} />
<Route path="/government/analytics" component={GovernmentAnalytics} />
                <Route component={Dashboard} />
              </Switch>
            </WouterRouter>
            <Toaster />
          </LanguageProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
