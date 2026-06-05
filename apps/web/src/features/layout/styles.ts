// Shared CSS for the /app layout shell and pages.
// Plain string export so route files can drop it into a <style> tag.

export const appLayoutStyles = `
  .app-root { min-height: 100vh; display: flex; flex-direction: column; }
  .app-main {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 32px;
    border-bottom: 1px solid var(--hairline);
    background: var(--glass);
    backdrop-filter: blur(20px);
  }
  .app-header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--chip);
    border: 1px solid var(--hairline);
    font-size: 13px;
  }
  .user-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ok);
    box-shadow: 0 0 0 4px rgba(0, 217, 126, 0.18);
  }
  .user-name { color: var(--text); font-weight: 500; }

  /* Shared input style — matches auth.tsx */
  .input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    border: 1px solid var(--hairline-strong);
    border-radius: 10px;
    background: var(--glass);
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-sans);
    backdrop-filter: blur(10px);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input::placeholder { color: var(--text-3); }
  .input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  /* Workspace list (index) — empty + grid */
  .empty-shell {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 48px 24px;
  }
  .empty-card {
    width: 100%;
    max-width: 560px;
    padding: 40px;
    background: var(--glass);
    backdrop-filter: blur(24px);
    border: 1px solid var(--hairline);
    border-radius: 20px;
    box-shadow: var(--shadow);
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }
  .eyebrow::before {
    content: "";
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft);
  }
  .empty-title {
    font-family: var(--font-sans);
    font-size: 36px;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 14px;
  }
  .empty-title .em {
    font-style: italic;
    font-weight: 500;
    background: linear-gradient(95deg, var(--accent), #ff8a5b 70%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .empty-sub {
    color: var(--text-2);
    font-size: 14.5px;
    line-height: 1.6;
    margin: 0 0 24px;
  }
  .empty-form {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }
  .empty-form .input { flex: 1; }
  .empty-form .submit {
    white-space: nowrap;
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    box-shadow: 0 8px 24px -8px var(--accent-ring);
  }
  .empty-form .submit:hover { background: var(--accent-2); }
  .empty-form .submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .empty-error {
    margin-top: 14px;
    color: var(--err);
    font-size: 13px;
    padding: 10px 12px;
    border: 1px solid var(--err);
    border-radius: 8px;
    background: rgba(255, 77, 109, 0.08);
  }

  .ws-shell {
    flex: 1;
    padding: 36px 40px 60px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }
  .ws-bar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .ws-title {
    font-family: var(--font-sans);
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
  }
  .ws-sub {
    color: var(--text-3);
    font-size: 13px;
    margin: 6px 0 0;
    font-family: var(--font-mono);
  }
  .ws-create {
    background: var(--glass);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    backdrop-filter: blur(20px);
  }
  .ws-create-actions { display: flex; gap: 8px; }
  .ws-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .ws-card {
    background: var(--glass);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 20px;
    backdrop-filter: blur(20px);
    transition: border-color 0.15s, transform 0.1s, box-shadow 0.15s;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .ws-card:hover {
    border-color: var(--hairline-strong);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .ws-card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }
  .ws-card-name { font-size: 17px; font-weight: 600; color: var(--text); }
  .ws-card-mono { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
  .ws-card-meta { margin-bottom: 14px; }
  .ws-card-date { font-size: 12.5px; color: var(--text-2); }
  .ws-card-foot {
    padding-top: 12px;
    border-top: 1px solid var(--hairline);
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-3);
  }
  .ws-card-hint { color: var(--text-3); }

  /* Workspace detail page — sidebar + main */
  .wsd-shell {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 0;
  }
  .wsd-sidebar {
    border-right: 1px solid var(--hairline);
    background: var(--glass-thin);
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .wsd-side-head {
    padding: 0 20px 14px;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 14px;
  }
  .wsd-side-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .wsd-side-sub {
    color: var(--text-3);
    font-size: 12px;
    margin: 4px 0 0;
    font-family: var(--font-mono);
  }
  .wsd-side-section-title {
    padding: 0 20px;
    margin: 0 0 10px;
    color: var(--text-3);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-family: var(--font-mono);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .wsd-side-add {
    background: transparent;
    border: 1px solid var(--hairline);
    border-radius: 6px;
    color: var(--text-2);
    cursor: pointer;
    padding: 2px 8px;
    font-size: 11px;
    font-family: var(--font-mono);
    transition: background .15s, color .15s, border-color .15s;
  }
  .wsd-side-add:hover {
    background: var(--chip);
    color: var(--text);
    border-color: var(--hairline-strong);
  }
  .wsd-coll-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .wsd-coll-item {
    padding: 8px 20px;
    cursor: pointer;
    color: var(--text-2);
    font-size: 13.5px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background .12s, color .12s;
    border-left: 2px solid transparent;
  }
  .wsd-coll-item:hover {
    background: var(--chip);
    color: var(--text);
  }
  .wsd-coll-item.active {
    background: var(--chip-hover);
    color: var(--text);
    border-left-color: var(--accent);
  }
  .wsd-coll-icon {
    color: var(--text-3);
    flex-shrink: 0;
  }
  .wsd-coll-empty {
    padding: 20px;
    color: var(--text-3);
    font-size: 12.5px;
    text-align: center;
    font-style: italic;
  }
  .wsd-coll-create {
    padding: 12px 20px;
    border-top: 1px solid var(--hairline);
    margin-top: auto;
  }
  .wsd-coll-create .input {
    font-size: 13px;
    padding: 8px 10px;
    margin-bottom: 8px;
  }
  .wsd-coll-create-actions {
    display: flex;
    gap: 6px;
  }
  .wsd-coll-create-actions button {
    flex: 1;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  .wsd-coll-create-actions .ok {
    background: var(--accent);
    color: #fff;
    border: none;
  }
  .wsd-coll-create-actions .ok:hover { background: var(--accent-2); }
  .wsd-coll-create-actions .ok:disabled { opacity: 0.55; cursor: not-allowed; }
  .wsd-coll-create-actions .cancel {
    background: transparent;
    border: 1px solid var(--hairline-strong);
    color: var(--text-2);
  }
  .wsd-coll-create-actions .cancel:hover { background: var(--chip); }

  .wsd-main {
    padding: 40px;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-y: auto;
  }
  .wsd-main-eyebrow {
    color: var(--text-3);
    font-size: 12px;
    font-family: var(--font-mono);
    margin-bottom: 10px;
  }
  .wsd-main-title {
    font-family: var(--font-sans);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }
  .wsd-main-sub {
    color: var(--text-2);
    font-size: 14px;
    margin: 0 0 28px;
    max-width: 580px;
    line-height: 1.5;
  }
  .wsd-main-empty {
    padding: 60px 24px;
    border: 1px dashed var(--hairline-strong);
    border-radius: 14px;
    text-align: center;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 13px;
    max-width: 560px;
  }
  .wsd-back {
    color: var(--text-3);
    font-size: 12.5px;
    text-decoration: none;
    margin-bottom: 14px;
    display: inline-block;
    font-family: var(--font-mono);
  }
  .wsd-back:hover { color: var(--text); }

  @media (max-width: 800px) {
    .wsd-shell { grid-template-columns: 1fr; }
    .wsd-sidebar { border-right: 0; border-bottom: 1px solid var(--hairline); }
  }
  @media (max-width: 700px) {
    .empty-form { flex-direction: column; }
    .empty-form .submit { width: 100%; justify-content: center; }
    .ws-shell { padding: 24px 16px 40px; }
    .app-header { padding: 16px 18px; gap: 8px; }
  }
`
