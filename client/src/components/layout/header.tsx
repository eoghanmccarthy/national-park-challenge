import { Home } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white border-b border-stone-light">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <Home className="w-8 h-8 text-forest" />
            <h1 className="font-heading font-bold text-xl md:text-2xl text-stone-dark">nps rank</h1>
          </a>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/">
            <a className="font-heading font-medium text-forest hover:text-forest-dark">Vote</a>
          </Link>
          <a href="#rankings" className="font-heading font-medium text-stone hover:text-stone-dark">
            Rankings
          </a>
          <a href="#" className="font-heading font-medium text-stone hover:text-stone-dark">
            Parks
          </a>
          <a href="#" className="font-heading font-medium text-stone hover:text-stone-dark">
            About
          </a>
        </nav>
        <button className="md:hidden focus:outline-none" aria-label="Menu">
          <svg
            className="w-6 h-6 text-stone-dark"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
