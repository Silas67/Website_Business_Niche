import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getGetWebsiteLeadSummaryQueryKey,
  getListWebsiteLeadsQueryKey,
  useCreateWebsiteLead,
  useGetWebsiteLeadSummary,
  useListWebsiteLeads,
} from '@workspace/api-client-react';
import type { WebsiteLeadInputNiche } from '@workspace/api-client-react';
import { ArrowDown, ArrowRight, Check, ChevronDown, Clock3, Globe2, LockKeyhole, Mail, Phone, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const appPath = (path: string) => `${basePath}${path}`;
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the environment.');
const niches: WebsiteLeadInputNiche[] = [
  'Portfolio', 'Restaurant', 'Clinic', 'Salon & Beauty', 'Fashion', 'Real Estate', 'Education', 'Other',
];

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#27594c',
    colorForeground: '#263b35',
    colorMutedForeground: '#718078',
    colorDanger: '#b54c45',
    colorBackground: '#fbf8f1',
    colorInput: '#fffdf8',
    colorInputForeground: '#263b35',
    colorNeutral: '#d8d3c8',
    fontFamily: 'DM Sans',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf8f1] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#d8d3c8]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#263b35] font-serif',
    headerSubtitle: 'text-[#718078]',
    socialButtonsBlockButtonText: 'text-[#263b35]',
    formFieldLabel: 'text-[#263b35]',
    footerActionLink: 'text-[#27594c]',
    footerActionText: 'text-[#718078]',
    dividerText: 'text-[#718078]',
    identityPreviewEditButton: 'text-[#27594c]',
    formFieldSuccessText: 'text-[#27594c]',
    alertText: 'text-[#263b35]',
    logoBox: 'mb-2',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#d8d3c8] text-[#263b35]',
    formButtonPrimary: 'bg-[#27594c] hover:bg-[#1e493e] text-white',
    formFieldInput: 'bg-[#fffdf8] border-[#d8d3c8] text-[#263b35]',
    footerAction: 'text-[#718078]',
    dividerLine: 'bg-[#d8d3c8]',
    alert: 'border-[#d8d3c8]',
    otpCodeFieldInput: 'bg-[#fffdf8] border-[#d8d3c8] text-[#263b35]',
    formFieldRow: 'text-[#263b35]',
    main: 'text-[#263b35]',
  },
};

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <a href={appPath('/')} className={`inline-flex items-center gap-2.5 ${dark ? 'text-[#f8f4e9]' : 'text-[#263b35]'}`} aria-label="Smallsite home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#27594c] text-[#fbf8f1]"><span className="font-serif text-xl leading-none">s.</span></span>
      <span className="text-[17px] font-bold tracking-[-0.04em]">smallsite<span className="text-[#d96b4c]">.</span></span>
    </a>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-5">
      <Brand />
      <div className="flex items-center gap-4">
        <a href="#how-it-works" className="hidden text-sm font-semibold text-[#52655e] hover:text-[#27594c] sm:block">How it works</a>
        <a href={appPath('/admin')} data-testid="link-admin" className="rounded-full border border-[#d8d3c8] px-4 py-2 text-sm font-semibold text-[#344941] transition hover:border-[#27594c] hover:bg-[#f0ede4]">Owner sign in</a>
      </div>
    </header>
  );
}

function BookingForm() {
  const cache = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [niche, setNiche] = useState<WebsiteLeadInputNiche | ''>('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState('');
  const createLead = useCreateWebsiteLead({ request: { credentials: 'include' } });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    if (!niche) {
      setLocalError('Choose the kind of business you run to continue.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setLocalError('Add an email address or phone number so we can reach you.');
      return;
    }
    try {
      await createLead.mutateAsync({
        data: { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, niche },
      });
      await Promise.all([
        cache.invalidateQueries({ queryKey: getListWebsiteLeadsQueryKey() }),
        cache.invalidateQueries({ queryKey: getGetWebsiteLeadSummaryQueryKey() }),
      ]);
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setNiche('');
    } catch {
      setLocalError('We couldn’t send your request just now. Please check your connection and try again.');
    }
  };

  if (submitted) {
    return (
      <section className="rounded-[1.6rem] border border-[#ded9cd] bg-[#fffdf8] p-7 shadow-[0_22px_70px_-42px_rgba(35,59,51,.36)] sm:p-9" aria-live="polite">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#e3eee6] text-[#27594c]"><Check size={23} /></div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[.17em] text-[#78857e]">Request received</p>
        <h2 className="font-serif text-3xl leading-tight text-[#263b35]">You’re on your way.</h2>
        <p className="mt-3 max-w-sm leading-7 text-[#63736c]">Thanks for reaching out. We’ll get in touch to learn a little about your business and next steps.</p>
        <button onClick={() => setSubmitted(false)} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#27594c] hover:gap-3 transition-all" data-testid="button-another-request">Send another request <ArrowRight size={16} /></button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="relative rounded-[1.6rem] border border-[#ded9cd] bg-[#fffdf8] p-6 shadow-[0_22px_70px_-42px_rgba(35,59,51,.36)] sm:p-8" aria-label="Request your website">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d96b4c]">Start in under a minute</p>
          <h2 className="mt-2 font-serif text-[27px] leading-tight tracking-[-.03em] text-[#263b35]">Tell us who you are.</h2>
        </div>
        <span className="rounded-full bg-[#f1eee5] px-3 py-1.5 text-[11px] font-bold text-[#53645d]">01 / 01</span>
      </div>
      <label htmlFor="lead-name" className="mb-1.5 block text-[13px] font-bold text-[#334a41]">Your name <span className="text-[#d96b4c]">*</span></label>
      <input id="lead-name" data-testid="input-name" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ada Okafor" className="mb-4 h-12 w-full rounded-xl border border-[#ddd8cc] bg-[#fffefa] px-4 text-[14px] text-[#263b35] outline-none transition placeholder:text-[#a5aaa2] focus:border-[#528071] focus:ring-4 focus:ring-[#27594c]/10" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-email" className="mb-1.5 block text-[13px] font-bold text-[#334a41]">Email <span className="font-normal text-[#8a928d]">optional</span></label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86928a]" size={16} />
            <input id="lead-email" data-testid="input-email" type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" className="h-12 w-full rounded-xl border border-[#ddd8cc] bg-[#fffefa] pl-10 pr-3 text-[13px] text-[#263b35] outline-none transition placeholder:text-[#a5aaa2] focus:border-[#528071] focus:ring-4 focus:ring-[#27594c]/10" />
          </div>
        </div>
        <div>
          <label htmlFor="lead-phone" className="mb-1.5 block text-[13px] font-bold text-[#334a41]">Phone <span className="font-normal text-[#8a928d]">optional</span></label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86928a]" size={16} />
            <input id="lead-phone" data-testid="input-phone" type="tel" minLength={7} maxLength={32} autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="h-12 w-full rounded-xl border border-[#ddd8cc] bg-[#fffefa] pl-10 pr-3 text-[13px] text-[#263b35] outline-none transition placeholder:text-[#a5aaa2] focus:border-[#528071] focus:ring-4 focus:ring-[#27594c]/10" />
          </div>
        </div>
      </div>
      <label htmlFor="lead-niche" className="mb-1.5 mt-4 block text-[13px] font-bold text-[#334a41]">What kind of business? <span className="text-[#d96b4c]">*</span></label>
      <div className="relative">
        <select id="lead-niche" data-testid="select-niche" required value={niche} onChange={e => setNiche(e.target.value as WebsiteLeadInputNiche)} className="h-12 w-full appearance-none rounded-xl border border-[#ddd8cc] bg-[#fffefa] px-4 pr-10 text-[14px] text-[#263b35] outline-none transition focus:border-[#528071] focus:ring-4 focus:ring-[#27594c]/10">
          <option value="" disabled>Select your business type</option>
          {niches.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#74837b]" size={17} />
      </div>
      {localError && <p role="alert" data-testid="status-form-error" className="mt-3 rounded-lg bg-[#fbefeb] px-3 py-2 text-sm text-[#9e433b]">{localError}</p>}
      <button type="submit" disabled={createLead.isPending} data-testid="button-submit-request" className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#27594c] px-5 text-[15px] font-bold text-[#fffdf8] transition hover:bg-[#1f493e] focus:outline-none focus:ring-4 focus:ring-[#27594c]/20 disabled:cursor-wait disabled:opacity-70">
        {createLead.isPending ? 'Sending your request…' : <>Request my website <ArrowRight size={17} /></>}
      </button>
      <p className="mt-3 text-center text-[11px] leading-5 text-[#808a83]">No payment today. We’ll follow up before anything begins.</p>
    </form>
  );
}

function Home() {
  return (
    <div className="grain min-h-[100dvh] bg-[#f5f2e9]">
      <div className="mx-auto max-w-[1190px] px-5 sm:px-8">
        <Header />
        <main>
          <section className="grid items-center gap-10 pb-16 pt-9 sm:pb-24 sm:pt-16 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
            <div className="rise-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dcd7cb] bg-[#faf8f1] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#52675d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d96b4c]" /> A little website goes a long way
              </div>
              <h1 className="max-w-[680px] font-serif text-[clamp(3.6rem,8vw,6.8rem)] leading-[.9] tracking-[-.065em] text-[#243b33]">
                Your business,<br /><span className="italic text-[#d96b4c]">on the map.</span>
              </h1>
              <p className="mt-7 max-w-[490px] text-[16px] leading-7 text-[#64746c] sm:text-[18px] sm:leading-8">
                A neat, ready-to-go website for your small business. Pick a starting style, tell us what you do, and we’ll take it from there.
              </p>
              <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2">
                <div className="font-serif text-[46px] leading-none tracking-[-.055em] text-[#243b33]">₦50,000</div>
                <span className="mb-1 rounded-full bg-[#e5ede5] px-3 py-1 text-[11px] font-bold text-[#386356]">one simple price</span>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-semibold text-[#60736a]">
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#d96b4c]" /> Compact, template-based design</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#d96b4c]" /> No long sales calls</span>
              </div>
              <a href="#request" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d96b4c] px-6 py-3.5 text-sm font-bold text-[#fffaf2] transition hover:-translate-y-0.5 hover:bg-[#c45c40]">
                Get started <ArrowDown size={16} />
              </a>
            </div>
            <div className="rise-in-delay relative mx-auto w-full max-w-[550px] lg:ml-auto">
              <div className="absolute -right-3 -top-4 z-10 hidden -rotate-3 rounded-xl border border-[#e6decc] bg-[#fcfaf3] px-4 py-3 shadow-lg sm:block">
                <span className="block font-mono text-[9px] uppercase tracking-[.16em] text-[#8b9288]">Made for your next chapter</span>
                <span className="mt-1 block font-serif text-lg italic text-[#27594c]">Small start. Real presence.</span>
              </div>
              <div className="overflow-hidden rounded-[1.7rem] border border-[#d7d3c8] bg-[#e9e4d8] p-3 shadow-[0_30px_80px_-42px_rgba(35,59,51,.4)]">
                <div className="overflow-hidden rounded-[1.2rem] bg-[#fcfaf3]">
                  <div className="flex h-9 items-center gap-1.5 border-b border-[#e9e4d8] px-4">
                    <span className="h-2 w-2 rounded-full bg-[#d9a58d]" /><span className="h-2 w-2 rounded-full bg-[#e2c886]" /><span className="h-2 w-2 rounded-full bg-[#9db5a2]" />
                    <span className="ml-2 h-4 w-[42%] rounded bg-[#f0ede4]" />
                  </div>
                  <div className="relative min-h-[310px] overflow-hidden bg-[#e8ede3] px-6 py-7 sm:min-h-[390px] sm:px-10 sm:py-9">
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-serif text-sm font-semibold tracking-tight text-[#294b3d]">Morrow & Moss</span>
                      <span className="rounded-full bg-[#294b3d] px-3 py-1.5 text-[9px] font-bold text-white">Say hello</span>
                    </div>
                    <div className="relative z-10 mt-9 max-w-[260px]">
                      <p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#738c78]">Slow grown. Close to home.</p>
                      <h3 className="mt-3 font-serif text-[42px] leading-[.92] tracking-[-.05em] text-[#28473c] sm:text-[56px]">Good things<br /><i>grow here.</i></h3>
                      <p className="mt-4 max-w-[195px] text-[10px] leading-5 text-[#62796b]">A neighbourhood flower studio for thoughtful days and ordinary Tuesdays.</p>
                      <span className="mt-5 inline-flex rounded-full border border-[#9eae9c] px-3.5 py-2 text-[9px] font-semibold text-[#294b3d]">Explore the studio <ArrowRight size={11} className="ml-2" /></span>
                    </div>
                    <div className="absolute -bottom-8 -right-8 h-[230px] w-[210px] rounded-[48%_52%_45%_55%] bg-[#d3a18a] sm:h-[280px] sm:w-[270px]" />
                    <div className="absolute bottom-5 right-8 h-[185px] w-[150px] rotate-[10deg] rounded-[52%_48%_8%_8%] bg-[#748f76] sm:right-14 sm:h-[235px] sm:w-[190px]" />
                    <div className="absolute bottom-12 right-[78px] h-[155px] w-[82px] -rotate-[23deg] rounded-[50%_50%_7%_7%] bg-[#d9c47c] sm:right-[120px] sm:h-[195px] sm:w-[100px]" />
                    <div className="absolute bottom-[78px] right-[64px] h-[66px] w-[45px] rotate-[-38deg] rounded-[70%_20%_70%_20%] bg-[#f0dd9d] sm:right-[98px] sm:bottom-[100px] sm:h-[82px] sm:w-[60px]" />
                    <div className="absolute bottom-[110px] right-[35px] h-[72px] w-[42px] rotate-[38deg] rounded-[20%_70%_20%_70%] bg-[#f0dd9d] sm:right-[52px] sm:bottom-[143px] sm:h-[90px] sm:w-[56px]" />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#e9e4d8] px-5 py-3 text-[9px] text-[#8d978e]">
                    <span>Home　About　Visit</span><span>Designed for a small business</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-[#e1ddd2] bg-[#fbf9f2] px-4 py-3 shadow-lg sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dce9dd] text-[#27594c]"><Globe2 size={16} /></span>
                <span><b className="block text-[11px] text-[#314b40]">A clear first impression</b><small className="text-[10px] text-[#829087]">Just the essentials, done well.</small></span>
              </div>
            </div>
          </section>

          <section id="request" className="scroll-mt-8 grid gap-10 border-t border-[#ded9cd] py-14 sm:py-20 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
            <div className="max-w-md pt-2">
              <p className="font-mono text-[10px] uppercase tracking-[.19em] text-[#d96b4c]">A good first step</p>
              <h2 className="mt-4 font-serif text-4xl leading-[1.03] tracking-[-.045em] text-[#243b33] sm:text-[52px]">Let’s make it<br /><i>easy to find you.</i></h2>
              <p className="mt-5 text-[15px] leading-7 text-[#68776f]">A few details are all we need. We’ll be in touch personally to talk through the next step.</p>
              <div className="mt-8 space-y-4 border-l border-[#d8d3c8] pl-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-[#d96b4c]">01</span>
                  <p className="text-[13px] leading-5 text-[#54665d]"><b className="text-[#314b40]">Send a request</b><br />Tell us your name and what you do.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-[#d96b4c]">02</span>
                  <p className="text-[13px] leading-5 text-[#54665d]"><b className="text-[#314b40]">We’ll reach out</b><br />A real conversation, without the hard sell.</p>
                </div>
              </div>
            </div>
            <BookingForm />
          </section>

          <section id="how-it-works" className="grid gap-8 border-t border-[#ded9cd] py-14 sm:grid-cols-3 sm:gap-7 sm:py-16">
            <div className="sm:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[.19em] text-[#d96b4c]">Just enough website</p>
              <h2 className="mt-3 max-w-lg font-serif text-3xl tracking-[-.035em] text-[#263b35] sm:text-4xl">A small, useful place<br className="hidden sm:block" /> for your business online.</h2>
            </div>
            <div className="border-t border-[#d8d3c8] pt-4">
              <span className="font-mono text-[11px] text-[#d96b4c]">01 / A solid starting point</span>
              <p className="mt-3 text-[14px] leading-6 text-[#5d7066]">A compact template shaped around your kind of business—not a sprawling custom build.</p>
            </div>
            <div className="border-t border-[#d8d3c8] pt-4">
              <span className="font-mono text-[11px] text-[#d96b4c]">02 / The details that matter</span>
              <p className="mt-3 text-[14px] leading-6 text-[#5d7066]">A polished home for your story, what you offer, and the easiest way to reach you.</p>
            </div>
            <div className="border-t border-[#d8d3c8] pt-4">
              <span className="font-mono text-[11px] text-[#d96b4c]">03 / A simple next step</span>
              <p className="mt-3 text-[14px] leading-6 text-[#5d7066]">One clear ₦50,000 price. No drawn-out pitch and no pressure to decide on this page.</p>
            </div>
          </section>
        </main>
        <footer className="flex flex-col gap-3 border-t border-[#ded9cd] py-6 text-[11px] text-[#78837c] sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <span>Small websites for the people building good things.</span>
          <a href={appPath('/admin')} className="font-semibold text-[#53675c] hover:text-[#27594c]">Owner access</a>
        </footer>
      </div>
    </div>
  );
}

function SignInPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f5f2e9] px-4 py-10"><div className="w-full max-w-[440px]"><div className="mb-7 text-center"><Brand /><p className="mt-4 text-sm text-[#69776f]">Sign in to the Smallsite owner inbox.</p></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div>;
}

function SignUpPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f5f2e9] px-4 py-10"><div className="w-full max-w-[440px]"><div className="mb-7 text-center"><Brand /><p className="mt-4 text-sm text-[#69776f]">Create an account to access the owner inbox.</p></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></div>;
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

function Admin() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const queryEnabled = isLoaded && !!user;
  const userScope = user?.id ?? 'signed-out';
  const leads = useListWebsiteLeads({ query: { enabled: queryEnabled, queryKey: [...getListWebsiteLeadsQueryKey(), userScope] }, request: { credentials: 'include' } });
  const summary = useGetWebsiteLeadSummary({ query: { enabled: queryEnabled, queryKey: [...getGetWebsiteLeadSummaryQueryKey(), userScope] }, request: { credentials: 'include' } });
  const isForbidden = getHttpStatus(leads.error) === 403 || getHttpStatus(summary.error) === 403;

  if (!isLoaded) {
    return <AdminShell><div className="mx-auto max-w-5xl animate-pulse"><div className="h-7 w-36 rounded bg-[#e5e1d7]" /><div className="mt-5 h-24 rounded-2xl bg-[#e5e1d7]" /><div className="mt-5 h-60 rounded-2xl bg-[#e5e1d7]" /></div></AdminShell>;
  }
  if (!user) {
    return <AdminShell><div className="mx-auto max-w-xl rounded-3xl border border-[#ded9cd] bg-[#fffdf8] p-8 text-center sm:p-12"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e9eee7] text-[#27594c]"><LockKeyhole size={22} /></span><h1 className="mt-5 font-serif text-3xl text-[#263b35]">Owner sign in</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#66766d]">Sign in with the owner account to view website requests.</p><a href={appPath('/sign-in')} data-testid="link-admin-sign-in" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#27594c] px-6 py-3 text-sm font-bold text-white hover:bg-[#1e493e]">Continue to sign in <ArrowRight size={16} /></a></div></AdminShell>;
  }
  if (isForbidden) {
    return <AdminShell><div className="mx-auto max-w-xl rounded-3xl border border-[#ded9cd] bg-[#fffdf8] p-8 text-center sm:p-12"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f8eae4] text-[#bd5a43]"><ShieldAlert size={22} /></span><h1 className="mt-5 font-serif text-3xl text-[#263b35]">This inbox is private.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#66766d]">The account <b className="break-all text-[#344941]">{email || 'currently signed-in account'}</b> isn’t authorized to view submissions. Sign in with the owner account or contact the project owner.</p><button type="button" onClick={() => signOut({ redirectUrl: `${basePath}/` })} data-testid="button-sign-out-unauthorized" className="mt-7 rounded-full border border-[#d8d3c8] px-5 py-2.5 text-sm font-bold text-[#39584d] hover:bg-[#f0ede4]">Sign out</button></div></AdminShell>;
  }

  const isLoading = leads.isLoading || summary.isLoading;
  const hasError = leads.isError || summary.isError;
  const retry = () => { void leads.refetch(); void summary.refetch(); };
  const niceDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'MMM d, yyyy · h:mm a');
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#d96b4c]">Smallsite / owner desk</p>
            <h1 className="mt-2 font-serif text-4xl tracking-[-.04em] text-[#263b35]">Website requests</h1>
            <p className="mt-2 text-sm text-[#6e7b73]">A quiet place to keep track of who’s getting started.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="max-w-[200px] truncate text-xs text-[#6f7d75]">{email}</span>
            <button type="button" onClick={() => signOut({ redirectUrl: `${basePath}/` })} data-testid="button-sign-out" className="rounded-full border border-[#d8d3c8] px-4 py-2 text-xs font-bold text-[#39584d] hover:bg-[#f0ede4]">Sign out</button>
          </div>
        </div>
        {isLoading ? (
          <div className="animate-pulse space-y-4" aria-label="Loading submissions"><div className="h-32 rounded-2xl bg-[#e7e2d7]" /><div className="h-80 rounded-2xl bg-[#e7e2d7]" /></div>
        ) : hasError ? (
          <div role="alert" className="rounded-2xl border border-[#e1d6ca] bg-[#fffdf8] p-8 text-center"><p className="font-serif text-2xl text-[#263b35]">Couldn’t load the inbox.</p><p className="mt-2 text-sm text-[#6d7972]">Please try again in a moment.</p><button onClick={retry} data-testid="button-retry-inbox" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#27594c] px-5 py-2.5 text-sm font-bold text-white"><RefreshCw size={15} /> Try again</button></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
              <section className="relative overflow-hidden rounded-2xl bg-[#27594c] p-6 text-[#f7f3e8] sm:p-7">
                <span className="absolute -right-6 -top-12 h-44 w-44 rounded-full border border-white/10" /><span className="absolute -right-1 -top-7 h-32 w-32 rounded-full border border-white/10" />
                <p className="relative font-mono text-[10px] uppercase tracking-[.17em] text-[#bed0c5]">All requests</p>
                <div className="relative mt-3 flex items-end gap-3"><span data-testid="text-total-leads" className="font-serif text-6xl leading-none">{summary.data?.total ?? 0}</span><span className="mb-1 text-xs text-[#d3dfd6]">business owners</span></div>
                <p className="relative mt-4 text-xs text-[#bed0c5]">Every new idea starts somewhere.</p>
              </section>
              <section className="rounded-2xl border border-[#ded9cd] bg-[#fffdf8] p-6 sm:p-7">
                <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.17em] text-[#879188]">Business types</p><h2 className="mt-1 font-serif text-xl text-[#263b35]">What owners do</h2></div><Sparkles size={18} className="text-[#d96b4c]" /></div>
                {summary.data?.byNiche?.length ? <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">{[...summary.data.byNiche].sort((a,b) => b.count-a.count).slice(0, 6).map(item => {
                  const pct = summary.data?.total ? Math.max(8, item.count / summary.data.total * 100) : 8;
                  return <div key={item.niche} data-testid={`stat-niche-${item.niche.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                    <div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="truncate text-[#53645c]">{item.niche}</span><b className="text-[#354a40]">{item.count}</b></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#efede6]"><div className="h-full rounded-full bg-[#d96b4c]" style={{ width: `${pct}%` }} /></div>
                  </div>;
                })}</div> : <p className="mt-5 text-sm text-[#7b857e]">Niche totals will appear as requests come in.</p>}
              </section>
            </div>
            <section className="mt-6 overflow-hidden rounded-2xl border border-[#ded9cd] bg-[#fffdf8]">
              <div className="flex items-center justify-between border-b border-[#e9e5db] px-5 py-5 sm:px-7">
                <div><h2 className="font-serif text-2xl text-[#263b35]">Recent requests</h2><p className="mt-1 text-xs text-[#879188]">Newest first</p></div>
                <span className="rounded-full bg-[#f0ede4] px-3 py-1.5 font-mono text-[10px] text-[#68766e]">{leads.data?.length ?? 0} total</span>
              </div>
              {!leads.data?.length ? (
                <div className="px-6 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eaf0e8] text-[#47735f]"><Clock3 size={21} /></span><h3 className="mt-4 font-serif text-2xl text-[#344b41]">The inbox is clear.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#78847d]">New website requests will appear here as soon as someone submits the form.</p></div>
              ) : (
                <>
                  <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_1.3fr] gap-4 bg-[#f7f5ee] px-7 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#8b958d] md:grid"><span>Name</span><span>Contact</span><span>Business type</span><span>Received</span></div>
                  <div className="divide-y divide-[#eeeae1]">
                    {[...leads.data].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(lead => (
                      <article key={lead.id} data-testid={`row-lead-${lead.id}`} className="grid gap-3 px-5 py-5 transition hover:bg-[#fcfaf5] md:grid-cols-[1.2fr_1.4fr_1fr_1.3fr] md:items-center md:gap-4 md:px-7">
                        <div><p className="font-semibold text-[#31483e]">{lead.name}</p><p className="mt-1 text-[11px] text-[#89938c] md:hidden">{niceDate(lead.createdAt)}</p></div>
                        <div className="space-y-1 text-xs text-[#68776f]">
                          {lead.email ? <a href={`mailto:${lead.email}`} className="block w-fit hover:text-[#27594c]">{lead.email}</a> : <span className="block text-[#a4aaa4]">No email</span>}
                          {lead.phone ? <a href={`tel:${lead.phone}`} className="block w-fit hover:text-[#27594c]">{lead.phone}</a> : <span className="block text-[#a4aaa4]">No phone</span>}
                        </div>
                        <div><span className="inline-flex rounded-full bg-[#eaf0e8] px-3 py-1.5 text-[11px] font-semibold text-[#416455]">{lead.niche}</span></div>
                        <time className="hidden text-xs text-[#7c8780] md:block">{niceDate(lead.createdAt)}</time>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return <div className="grain min-h-[100dvh] bg-[#f5f2e9]"><div className="mx-auto max-w-[1190px] px-5 sm:px-8"><header className="flex h-[76px] items-center justify-between border-b border-[#ded9cd]"><Brand /><a href={appPath('/')} className="text-xs font-semibold text-[#65766d] hover:text-[#27594c]">Back to booking page <ArrowRight className="ml-1 inline" size={13} /></a></header><main className="py-9 sm:py-12">{children}</main><footer className="border-t border-[#ded9cd] py-5 text-[11px] text-[#879188]">Smallsite owner inbox <span className="mx-2">·</span> Private submissions</footer></div></div>;
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={Admin} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route><div className="grid min-h-[100dvh] place-items-center bg-[#f5f2e9]"><div className="text-center"><p className="font-mono text-xs uppercase tracking-widest text-[#d96b4c]">404 / Not found</p><h1 className="mt-3 font-serif text-4xl text-[#263b35]">This page wandered off.</h1><a href={appPath('/')} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#27594c]">Back to the booking page <ArrowRight size={15} /></a></div></div></Route>
      </Switch>
    </ErrorBoundary>
  );
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
      localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access the owner inbox' } }, signUp: { start: { title: 'Create your owner account', subtitle: 'Get started with Smallsite' } } }}
      routerPush={to => setLocation(stripBase(to))}
      routerReplace={to => setLocation(stripBase(to), { replace: true })}>
      <ClerkQueryClientCacheInvalidator />
      <Router />
    </ClerkProvider>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const cache = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) cache.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, cache]);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
