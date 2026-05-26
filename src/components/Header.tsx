import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export default function Header({ darkMode, toggleTheme }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 w-full px-6 py-5 backdrop-blur-md border-b flex items-center justify-between transition-colors duration-300 ${
      darkMode 
        ? 'bg-black/85 border-white/[0.05]' 
        : 'bg-white/85 border-zinc-200'
    }`}>
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <img
          src="https://res.cloudinary.com/dnatvwcxy/image/upload/v1779424576/logo_arthur_luz_e_som_lbrpth.jpg"
          alt="ARM Logo"
          className="h-8 w-auto rounded-md object-cover select-none filter drop-shadow-[0_0_5px_rgba(204,255,0,0.3)] shadow shadow-electric-lime/20"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col">
          <span className={`font-display font-extrabold text-sm tracking-wider ${
            darkMode ? 'text-white' : 'text-zinc-950'
          }`}>
            ARM SOM E LUZ
          </span>
          <span className={`text-[8px] font-medium leading-tight max-w-[180px] sm:max-w-[220px] mt-0.5 ${
            darkMode ? 'text-white/45' : 'text-zinc-500'
          }`}>
            Somos uma empresa de som e luz especializada em casamentos , festas debutantes, formaturas e renovação de votos.
          </span>
        </div>
      </div>

      {/* Theme Switcher Button */}
      <button
        onClick={toggleTheme}
        className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-electric-lime active:scale-95 border ${
          darkMode
            ? 'bg-zinc-900/60 border-white/[0.05] text-electric-lime hover:bg-zinc-900 hover:text-lime-400'
            : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-electric-lime'
        }`}
        aria-label="Alternar tema"
        id="theme-toggle-btn"
      >
        <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
          {darkMode ? (
            <Sun className="w-5 h-5 text-electric-lime transform transition-transform duration-500 hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-zinc-700 transform transition-transform duration-500" />
          )}
        </div>
      </button>
    </header>
  );
}
