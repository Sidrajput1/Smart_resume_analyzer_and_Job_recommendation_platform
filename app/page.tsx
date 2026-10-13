
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import Link from "next/link";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Sparkles, BriefcaseBusiness, BrainCircuit, ShieldCheck } from "lucide-react";
import { ArrowUpRight, Network, FileText, Compass } from "lucide-react";
import { Brand, ActionLink, TextLink } from "@/components/career/Primitives";
//import NextAuth from "next-auth";


export default async function Home() {
  //const session = await auth()
  const session = await getServerSession(authOptions);

  if(session?.user?.role === "CANDIDATE") redirect("/candidate")
  if(session?.user?.role === "RECRUITER") redirect("/recruiter");
  if(session?.user?.role === "ADMIN") redirect("/admin")
  return (

    <main className="landing">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link href="/" aria-label="Smart Resume Portal home">
          <Brand />
        </Link>
        <div>
          <TextLink href="/signin">Sign in</TextLink>
          <ActionLink href="/register" secondary>
            Get started
          </ActionLink>
        </div>
      </nav>
      <section className="landing-hero">
        <div>
          <span className="eyebrow">AN INTERFACE FOR HUMAN POTENTIAL</span>
          <h1>
            There’s more
            <br />
            to your story.
            <br />
            <em>Find its direction.</em>
          </h1>
          <p>
            Your capabilities. The evidence behind them. The opportunities
            ahead. A more thoughtful way to connect what you’ve done with what
            comes next.
          </p>
          <div className="landing-actions">
            <ActionLink href="/register">Start your next chapter</ActionLink>
            <TextLink href="/signin">Open your workspace</TextLink>
          </div>
        </div>
        <div className="landing-instrument">
          <div className="map-header">
            <span className="eyebrow">CAREER SIGNAL / HOW IT CONNECTS</span>
            <Network size={17} />
          </div>
          <h2>
            From what you know.
            <br />
            To what’s possible.
          </h2>
          {[
            {
              title: "Your capabilities",
              text: "The skills and experience in your profile.",
              icon: Network,
            },
            {
              title: "The evidence",
              text: "Your resume, your projects, your actual work.",
              icon: FileText,
            },
            {
              title: "Your possibilities",
              text: "Relevant roles and an intentional next step.",
              icon: Compass,
            },
          ].map(({ title, text, icon: Icon }, index) => (
            <div className="instrument-step" key={title}>
              <span className="index">0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <Icon size={20} strokeWidth={1.2} />
            </div>
          ))}
          <div className="instrument-footer">
            <span>CAPABILITY → EVIDENCE → OPPORTUNITY</span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </section>
      <section className="landing-editions">
        <div>
          <span className="eyebrow">01 / FOR CANDIDATES</span>
          <h2>A clearer picture of your next move.</h2>
          <p>
            Bring your resume to life. Review extracted information, explore
            your career intelligence, and understand the connections behind job
            recommendations.
          </p>
          <TextLink href="/register">Build your career atlas</TextLink>
        </div>
        <div>
          <span className="eyebrow">02 / FOR RECRUITERS</span>
          <h2>Go beyond the keyword.</h2>
          <p>
            Define the work. Investigate the evidence. Manage openings and
            applications in a workspace designed to support informed human
            decisions.
          </p>
          <TextLink href="/register">Open your talent signal desk</TextLink>
        </div>
      </section>
      <footer className="landing-footer">
        <span>Smart Resume Portal</span>
        <span className="eyebrow">HUMAN POTENTIAL, CONNECTED.</span>
        <span>Every story deserves a closer look.</span>
      </footer>
    </main>
    
  );
};


// feature row

// function FeatureRow({ title, desc }: { title: string; desc: string }) {
//   return (
//     <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
//       <p className="font-medium">{title}</p>
//       <p className="mt-1 text-sm text-slate-300">{desc}</p>
//     </div>
//   );
// }
