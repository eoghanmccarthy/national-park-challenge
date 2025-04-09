import { Home } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-100 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Home className="w-6 h-6 text-forest" />
              <span className="font-heading font-bold text-lg text-stone-dark">nps rank</span>
            </div>
            <p className="text-xs text-stone text-center md:text-left mt-2">
              Rank the best National Parks in the United States
            </p>
          </div>

          <div className="flex space-x-4 text-sm text-stone">
            <a href="#" className="hover:text-stone-dark">
              About
            </a>
            <a href="#" className="hover:text-stone-dark">
              Privacy
            </a>
            <a href="#" className="hover:text-stone-dark">
              Terms
            </a>
            <a href="#" className="hover:text-stone-dark">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone">
          <p>
            Data sourced from the National Park Service. This site is not affiliated with the NPS.
          </p>
          <p className="mt-1">© {new Date().getFullYear()} NPS Rank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
