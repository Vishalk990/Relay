import Link from "next/link";
import { NAV_ITEMS } from "./config";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-black font-sans">
      <nav
        className="sticky top-4 z-50 mx-auto mt-3 flex max-w-285 items-center gap-4.5
                rounded-[14px] border border-white/10 bg-glass
                py-2.5 pr-3.5 pl-4.5
                backdrop-blur-[28px] backdrop-saturate-150"
      >
        <a href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="grid size-7 place-items-center rounded-lg bg-blue-500 text-white">
            {/* your logo svg / lucide icon here */}
          </span>
          <span className="text-sm font-medium tracking-[0.3em] text-blue-400/80 uppercase">Relay</span>
        </a>
        <div className="ml-3 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((label) => (
            <a
              key={label}
              href="#"
              className="rounded-lg px-3 py-1.5 text-[13.5px] text-white/65
                  transition hover:bg-white/5 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="grid size-8 place-items-center rounded-lg text-white/65
                     transition hover:bg-white/5 hover:text-white"
          >
            {/* sun/moon icon */}
          </button>

          {/* Sign in — ghost */}
          <a
            href="/sign-in"
            className="rounded-lg px-3 py-1.5 text-[13.5px] text-white/80
                transition hover:bg-white/5 hover:text-white"
          >
            Sign in
          </a>

          {/* Get started — primary */}
          <a
            href="/sign-up"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[13.5px] font-medium text-white
                transition hover:bg-blue-500"
          >
            Get started <span className="opacity-70">→</span>
          </a>
        </div>
      </nav>
    </main>
  );
}
