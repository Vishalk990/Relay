import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Background } from "@/components/Background";
import { Brand, Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MethodPill } from "@/components/MethodPill";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  // Press "D" to jump into the demo app.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key.toLowerCase() === "d") window.location.href = "/app";
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="landing">
      <style>{landingStyles}</style>
      <Background />
      <div className="hero-glow" />

      <nav className="top glass wrap">
        <Brand />
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#">Docs</a>
          <a href="#">Changelog</a>
          <a href="#">Pricing</a>
        </div>
        <div className="nav-right">
          <ThemeToggle />
          <Link to="/auth" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="btn btn-primary btn-sm">
            Get started <span style={{ opacity: 0.7 }}>→</span>
          </Link>
        </div>
      </nav>

      <section className="hero wrap">
        <div className="eyebrow">
          <span className="tag">New</span>
          <span>Workspaces, environments, real-time collaboration</span>
        </div>
        <h1 className="hero-title">
          The API client that
          <br />
          <span className="em">doesn't get in the way.</span>
        </h1>
        <p className="sub">
          Relay is a fast, beautiful API client built for the browser. Build requests, chain environments, share
          collections — without leaving your tab.
        </p>
        <div className="cta-row">
          <Link to="/auth" search={{ mode: "signup" }} className="btn btn-primary">
            Start building <span style={{ opacity: 0.8 }}>→</span>
          </Link>
          <a className="btn" href="/app">
            Try the demo <kbd>D</kbd>
          </a>
        </div>

        <DemoCard />
      </section>

      <FeatureGrid />

      <footer className="wrap">
        <div className="foot-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span style={{ fontWeight: 600 }}>Relay</span>
            <span className="copyright">© 2026 — built for the browser.</span>
          </div>
          <div className="links">
            <a href="#">Docs</a>
            <a href="#">Changelog</a>
            <a href="#">Status</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DemoCard() {
  return (
    <div className="demo-wrap">
      <div className="demo glass-strong">
        <div className="demo-chrome">
          <div className="traffic">
            <span />
            <span />
            <span />
          </div>
          <div className="demo-tab">
            <MethodPill method="GET" /> Get user by id
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <span className="env-chip">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)" }} /> Production
            </span>
          </div>
        </div>
        <div className="demo-body">
          {/* REQUEST */}
          <div className="demo-col">
            <h4>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} /> Request
            </h4>
            <div className="url-bar pulse">
              <MethodPill method="GET" />
              <span className="url-seg scheme">https://</span>
              <span className="url-seg var">{"{{baseUrl}}"}</span>
              <span className="url-slash">/</span>
              <span className="url-seg path">v2</span>
              <span className="url-slash">/</span>
              <span className="url-seg path">users</span>
              <span className="url-slash">/</span>
              <span className="url-seg var">{"{{userId}}"}</span>
              <button className="send-btn">
                Send{" "}
                <kbd style={{ background: "rgba(255,255,255,.2)", borderColor: "transparent", color: "#fff" }}>⌘↵</kbd>
              </button>
            </div>
            <div className="section-label">Headers</div>
            <table className="row-table">
              <tbody>
                <tr>
                  <td className="k">Authorization</td>
                  <td>
                    Bearer <span className="pill">{"{{token}}"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="k">Accept</td>
                  <td>application/json</td>
                </tr>
                <tr>
                  <td className="k">X-Trace-Id</td>
                  <td>req_a8f29c</td>
                </tr>
              </tbody>
            </table>
            <div className="section-label">Query</div>
            <div className="env-strip">
              <span className="env-chip">
                <span className="k">expand</span>=posts,comments
              </span>
              <span className="env-chip">
                <span className="k">fields</span>=id,name,email
              </span>
            </div>
          </div>
          {/* RESPONSE */}
          <div className="demo-col">
            <h4>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ok)" }} /> Response
            </h4>
            <div className="status-line">
              <span className="status-200">● 200 OK</span>
              <span className="meta">142&nbsp;ms</span>
              <span className="meta">2.4&nbsp;kB</span>
              <span style={{ flex: 1 }} />
              <span className="meta">Pretty</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="timing-bar">
                <div style={{ width: "18%", background: "var(--m-get)" }} />
                <div style={{ width: "8%", background: "var(--m-patch)" }} />
                <div style={{ width: "64%", background: "var(--accent)" }} />
                <div style={{ width: "10%", background: "var(--m-post)" }} />
              </div>
              <div className="timing-labels">
                <span>DNS 25</span>
                <span>TCP 12</span>
                <span>Wait 91</span>
                <span>DL 14</span>
              </div>
            </div>
            <pre className="json">
              <span className="t-punct">{"{"}</span>
              {"\n  "}
              <span className="t-key">"id"</span>
              <span className="t-punct">:</span> <span className="t-str">"usr_a8f29c"</span>
              <span className="t-punct">,</span>
              {"\n  "}
              <span className="t-key">"name"</span>
              <span className="t-punct">:</span> <span className="t-str">"Ada Lovelace"</span>
              <span className="t-punct">,</span>
              {"\n  "}
              <span className="t-key">"email"</span>
              <span className="t-punct">:</span> <span className="t-str">"ada@analytical.engine"</span>
              <span className="t-punct">,</span>
              {"\n  "}
              <span className="t-key">"verified"</span>
              <span className="t-punct">:</span> <span className="t-bool">true</span>
              <span className="t-punct">,</span>
              {"\n  "}
              <span className="t-key">"posts"</span>
              <span className="t-punct">:</span> <span className="t-num">142</span>
              <span className="t-punct">,</span>
              {"\n  "}
              <span className="t-key">"plan"</span>
              <span className="t-punct">:</span> <span className="t-str">"team"</span>
              {"\n"}
              <span className="t-punct">{"}"}</span>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <section className="features wrap" id="features">
      <div className="features-head">
        <h2>Built for the way you actually work.</h2>
        <p>
          Every feature you'd expect from a request client — plus a few that make you wonder how you lived without them.
        </p>
      </div>
      <div className="grid">
        <div className="card col-3">
          <h3>A URL bar that thinks in segments.</h3>
          <p>
            Every part of your URL is a chip you can edit, swap, or wire to an environment. No more squinting at query
            strings.
          </p>
          <div className="visual">
            <div className="url-bar" style={{ margin: 0 }}>
              <MethodPill method="POST" />
              <span className="url-seg scheme">https://</span>
              <span className="url-seg var">{"{{apiHost}}"}</span>
              <span className="url-slash">/</span>
              <span className="url-seg path">orders</span>
            </div>
          </div>
        </div>

        <div className="card col-3">
          <h3>Side-by-side, not stacked.</h3>
          <p>
            Your request and its response sit next to each other. Tweak a header, watch the JSON update. No tab dance.
          </p>
          <div className="visual sbs">
            <div className="sbs-req">request</div>
            <div className="sbs-res">response</div>
          </div>
        </div>

        <div className="card col-2">
          <h3>Every method, in plain sight.</h3>
          <p>Color-coded so your eyes do half the work.</p>
          <div className="visual method-grid">
            <MethodPill method="GET" />
            <MethodPill method="POST" />
            <MethodPill method="PUT" />
            <MethodPill method="PATCH" />
            <MethodPill method="DELETE" />
          </div>
        </div>

        <div className="card col-2">
          <h3>Environments that travel with you.</h3>
          <p>Switch from dev to staging to prod in one click — variables follow.</p>
          <div className="visual env-strip">
            <span className="env-chip">
              <span className="k">baseUrl</span>=api.dev
            </span>
            <span className="env-chip">
              <span className="k">token</span>=sk_dev_•••
            </span>
            <span className="env-chip">
              <span className="k">userId</span>=42
            </span>
          </div>
        </div>

        <div className="card col-2">
          <h3>Auth, sorted.</h3>
          <p>Bearer, Basic, OAuth 2.0, API key. Sign requests, refresh tokens — all in line.</p>
          <div className="visual">
            <div className="auth-row">
              <span className="dot" style={{ background: "var(--ok)" }} /> Bearer
              <span className="auth-meta">eyJhbG•••</span>
            </div>
            <div className="auth-row">
              <span className="dot" style={{ background: "var(--text-3)" }} /> OAuth 2.0
              <span className="auth-meta">refreshes in 4h</span>
            </div>
          </div>
        </div>

        <div className="card col-3">
          <h3>Collections that don't get stale.</h3>
          <p>
            Organize requests in folders, share them with your team, and version every change. Pull requests for APIs,
            finally.
          </p>
          <div className="visual coll">
            <div className="coll-folder">
              <span>📁</span> Billing API <span className="coll-count">12 requests</span>
            </div>
            <div className="coll-item">
              <MethodPill method="GET" /> list invoices
            </div>
            <div className="coll-item">
              <MethodPill method="POST" /> create invoice
            </div>
            <div className="coll-item">
              <MethodPill method="DELETE" /> void invoice
            </div>
          </div>
        </div>

        <div className="card col-3">
          <h3>See exactly where the milliseconds went.</h3>
          <p>DNS, TCP, TTFB, download — broken down per request. Find the slow part instantly.</p>
          <div className="visual">
            <div className="timing-bar" style={{ marginBottom: 8 }}>
              <div style={{ width: "14%", background: "var(--m-get)" }} />
              <div style={{ width: "8%", background: "var(--m-patch)" }} />
              <div style={{ width: "58%", background: "var(--accent)" }} />
              <div style={{ width: "20%", background: "var(--m-post)" }} />
            </div>
            <div className="timing-legend">
              <span>
                <i style={{ background: "var(--m-get)" }} />
                DNS
              </span>
              <span>
                <i style={{ background: "var(--m-patch)" }} />
                TCP
              </span>
              <span>
                <i style={{ background: "var(--accent)" }} />
                Wait
              </span>
              <span>
                <i style={{ background: "var(--m-post)" }} />
                Download
              </span>
            </div>
          </div>
        </div>

        <div className="card col-6 cta-card">
          <div className="cta-card-inner">
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 24, marginBottom: 14 }}>Ready when you are.</h3>
              <p style={{ fontSize: 15, maxWidth: 460 }}>
                Start with a single request. Grow into a team workspace. No installs, no sync conflicts, just a tab.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/auth" search={{ mode: "signup" }} className="btn btn-primary">
                Create free account
              </Link>
              <a className="btn" href="/app">
                Open the app
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const landingStyles = `
  .landing { overflow-x: hidden; }
  .wrap { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 28px; }

  nav.top {
    position: sticky; top: 12px; z-index: 50;
    margin: 12px auto 0; max-width: 1140px;
    padding: 10px 14px 10px 18px;
    display: flex; align-items: center; gap: 18px;
    border-radius: 14px;
  }
  .nav-links { display: flex; gap: 4px; margin-left: 12px; }
  .nav-links a {
    padding: 6px 12px; border-radius: 8px;
    color: var(--text-2); font-size: 13.5px;
    text-decoration: none;
  }
  .nav-links a:hover { color: var(--text); background: var(--chip); }
  .nav-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  .hero {
    position: relative; z-index: 2;
    padding: 92px 0 60px;
    text-align: center;
  }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 6px 14px 6px 6px;
    border-radius: 999px;
    background: var(--glass);
    border: 1px solid var(--hairline);
    font-size: 12.5px;
    color: var(--text-2);
    margin-bottom: 28px;
  }
  .eyebrow .tag {
    background: var(--accent); color: #fff;
    padding: 3px 8px; border-radius: 999px;
    font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  h1.hero-title {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: clamp(44px, 7vw, 88px);
    line-height: 0.98;
    letter-spacing: -0.045em;
    margin: 0 0 22px;
    text-wrap: balance;
  }
  h1.hero-title .em {
    background: linear-gradient(95deg, var(--accent) 0%, var(--accent-2) 60%, #ffb98a 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    font-style: italic;
    font-weight: 500;
  }
  .sub {
    font-size: clamp(16px, 1.5vw, 19px);
    color: var(--text-2);
    max-width: 600px;
    margin: 0 auto 32px;
    text-wrap: balance;
  }
  .cta-row { display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; }
  .cta-row kbd { margin-left: 4px; }

  .hero-glow {
    position: absolute; left: 50%; top: 30%; transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
    filter: blur(120px);
    opacity: 0.25;
    pointer-events: none;
    z-index: 1;
  }
  [data-theme="light"] .hero-glow { opacity: 0.18; }

  /* DEMO CARD */
  .demo-wrap { position: relative; margin: 64px auto 0; max-width: 1080px; perspective: 2000px; }
  .demo {
    position: relative;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow);
    transform: rotateX(8deg);
    transform-origin: 50% 100%;
    transition: transform 0.6s cubic-bezier(.2,.7,.2,1);
  }
  .demo:hover { transform: rotateX(2deg); }
  .demo-chrome {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--hairline);
    background: var(--glass-strong);
  }
  .traffic { display: flex; gap: 7px; }
  .traffic span { width: 11px; height: 11px; border-radius: 50%; background: var(--chip-hover); }
  .demo-tab {
    margin-left: 12px;
    padding: 4px 10px 4px 8px;
    border-radius: 7px;
    background: var(--chip);
    font-size: 12px; color: var(--text-2);
    display: flex; align-items: center; gap: 8px;
  }
  .demo-body {
    background: var(--glass);
    backdrop-filter: blur(32px);
    padding: 22px;
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 18px;
    min-height: 440px;
  }
  .demo-col {
    background: var(--glass-thin);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 14px;
    display: flex; flex-direction: column;
    min-height: 0;
  }
  .demo-col h4 {
    margin: 0 0 12px;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    display: flex; align-items: center; gap: 8px;
  }

  /* URL bar (segmented) */
  .url-bar {
    display: flex; align-items: center; gap: 6px;
    background: var(--chip);
    border: 1px solid var(--hairline);
    border-radius: 10px;
    padding: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .url-seg {
    font-family: var(--font-mono);
    font-size: 12.5px;
    padding: 5px 8px;
    border-radius: 6px;
    background: var(--chip);
    color: var(--text);
    line-height: 1;
  }
  .url-seg.scheme { color: var(--text-3); background: transparent; padding: 5px 4px; }
  .url-seg.host   { color: var(--text); background: var(--chip-hover); }
  .url-seg.path   { color: var(--text); }
  .url-seg.var    {
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px dashed var(--accent-ring);
  }
  .url-seg.query  { color: var(--m-get); }
  .url-slash { color: var(--text-3); font-family: var(--font-mono); font-size: 12px; padding: 0 2px; }

  .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin: 14px 0 8px; }

  .row-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 12.5px; }
  .row-table td { padding: 7px 6px; border-bottom: 1px dashed var(--hairline); color: var(--text-2); }
  .row-table td.k { color: var(--text); width: 38%; }
  .row-table td .pill { display: inline-block; padding: 2px 6px; border-radius: 5px; background: var(--accent-soft); color: var(--accent); font-size: 11px; }

  .status-line {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-mono);
    font-size: 12.5px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--hairline);
  }
  .status-200 { color: var(--ok); }
  .status-line .meta { color: var(--text-3); }

  pre.json {
    margin: 0; flex: 1;
    font-family: var(--font-mono);
    font-size: 12.5px; line-height: 1.6;
    color: var(--text);
    overflow: hidden;
    white-space: pre;
  }
  .t-key   { color: var(--accent-2); }
  .t-str   { color: var(--m-post); }
  .t-num   { color: var(--m-patch); }
  .t-bool  { color: var(--m-get); }
  .t-null  { color: var(--text-3); }
  .t-punct { color: var(--text-3); }

  .timing-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--chip); }
  .timing-bar > div { height: 100%; }
  .timing-labels {
    display: flex; justify-content: space-between;
    font-size: 10.5px; color: var(--text-3);
    margin-top: 6px; font-family: var(--font-mono);
  }
  .timing-legend { display: flex; gap: 14px; font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
  .timing-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }

  /* env strip */
  .env-strip { display: flex; gap: 8px; flex-wrap: wrap; }
  .env-chip {
    font-family: var(--font-mono);
    font-size: 11.5px;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--chip);
    border: 1px solid var(--hairline);
    color: var(--text-2);
    display: inline-flex; align-items: center; gap: 6px;
  }
  .env-chip .k { color: var(--accent); }

  /* send button */
  .send-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 8px;
    font-weight: 600; font-size: 13px;
    cursor: pointer;
    margin-left: auto;
  }
  .send-btn:hover { background: var(--accent-2); }

  /* features */
  .features { padding: 96px 0 40px; position: relative; z-index: 2; }
  .features-head { text-align: center; margin-bottom: 56px; }
  .features-head h2 {
    font-family: var(--font-sans); font-weight: 600;
    font-size: clamp(32px, 4vw, 48px);
    letter-spacing: -0.035em; line-height: 1.05;
    margin: 0 0 14px;
  }
  .features-head p { color: var(--text-2); max-width: 540px; margin: 0 auto; font-size: 16px; }
  .grid {
    display: grid; gap: 16px;
    grid-template-columns: repeat(6, 1fr);
  }
  .card {
    background: var(--glass);
    backdrop-filter: blur(28px) saturate(140%);
    border: 1px solid var(--hairline);
    border-radius: 18px;
    padding: 22px;
    position: relative;
    overflow: hidden;
    min-height: 200px;
    display: flex; flex-direction: column;
  }
  .card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 600; letter-spacing: -0.015em; }
  .card p { margin: 0; color: var(--text-2); font-size: 13.5px; }
  .card .visual { margin-top: auto; padding-top: 18px; }
  .col-3 { grid-column: span 3; }
  .col-2 { grid-column: span 2; }
  .col-4 { grid-column: span 4; }
  .col-6 { grid-column: span 6; }

  /* method palette visual */
  .method-grid { display: flex; gap: 8px; flex-wrap: wrap; }
  .method-grid .method { padding: 6px 12px; font-size: 12.5px; }

  /* side-by-side visual */
  .sbs { display: flex; gap: 8px; }
  .sbs-req, .sbs-res {
    flex: 1; height: 80px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-family: var(--font-mono);
  }
  .sbs-req { background: var(--chip); border: 1px solid var(--hairline); color: var(--text-3); }
  .sbs-res { background: var(--accent-soft); border: 1px solid var(--accent-ring); color: var(--accent); }

  /* auth-row */
  .auth-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--text-2);
    font-family: var(--font-mono);
    margin-bottom: 6px;
  }
  .auth-row .dot { width: 6px; height: 6px; border-radius: 50%; }
  .auth-row .auth-meta { margin-left: auto; color: var(--text-3); }

  /* collections visual */
  .coll { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-mono); font-size: 12px; }
  .coll-folder { display: flex; align-items: center; gap: 8px; color: var(--text-2); }
  .coll-folder .coll-count { margin-left: auto; color: var(--text-3); font-size: 10.5px; }
  .coll-item { display: flex; align-items: center; gap: 8px; padding-left: 18px; }

  /* CTA card */
  .cta-card { min-height: 180px; }
  .cta-card-inner { display: flex; align-items: center; gap: 32px; }

  /* footer */
  footer {
    padding: 80px 0 40px; position: relative; z-index: 2;
    border-top: 1px solid var(--hairline);
    margin-top: 80px;
  }
  .foot-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; }
  .foot-row .links { display: flex; gap: 22px; }
  .foot-row .links a { color: var(--text-2); text-decoration: none; font-size: 13.5px; }
  .foot-row .links a:hover { color: var(--text); }
  .copyright { color: var(--text-3); font-size: 12.5px; }

  /* pulse */
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--accent-ring); }
    50%      { box-shadow: 0 0 0 8px transparent; }
  }
  .pulse { animation: pulse 2s ease-in-out infinite; }

  @media (max-width: 900px) {
    .demo-body { grid-template-columns: 1fr; }
    .grid { grid-template-columns: repeat(2, 1fr); }
    .col-3, .col-4, .col-2, .col-6 { grid-column: span 2; }
    .nav-links { display: none; }
    .cta-card-inner { flex-direction: column; align-items: flex-start; }
  }
`;
