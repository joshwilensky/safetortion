import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  // close menu on route change (hashchange covers SPA nav via NavLink)
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("hashchange", close);
      window.removeEventListener("popstate", close);
    };
  }, []);

  return (
    <header className='site-header'>
      <div className='container header-inner'>
        {/* Brand */}
        <a href='/' className='brand' aria-label='Home'>
          <Logo />
          <span className='brand-name'>BocaSafe</span>
        </a>

        {/* Desktop nav */}
        <nav className='nav'>
          <Nav to='/' label='Scanner' />
          <Nav to='/report' label='Report' />
          <Nav to='/vault' label='Vault' />
        </nav>

        {/* Right actions (optional quick links) */}
        <div className='header-actions'>
          <a className='btn ghost small-hide' href='/report'>
            Start report
          </a>
          <button
            className='btn ghost nav-toggle'
            aria-expanded={open ? "true" : "false"}
            aria-label='Toggle menu'
            onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`nav-drawer ${open ? "open" : ""}`}>
        <Nav to='/' label='Scanner' onClick={() => setOpen(false)} />
        <Nav to='/report' label='Report' onClick={() => setOpen(false)} />
        <Nav to='/vault' label='Vault' onClick={() => setOpen(false)} />
      </div>
    </header>
  );
}

function Nav({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
      {label}
    </NavLink>
  );
}

function Logo() {
  return (
    <svg width='22' height='22' viewBox='0 0 24 24' aria-hidden='true'>
      <defs>
        <linearGradient id='g' x1='0' x2='0' y1='1' y2='0'>
          <stop offset='0' stopColor='#4f7bff' />
          <stop offset='1' stopColor='#7aa2ff' />
        </linearGradient>
      </defs>
      <path
        fill='url(#g)'
        d='M12 2l7 3v6c0 4.97-3.06 8.37-7 9.99C8.06 19.37 5 15.97 5 11V5l7-3z'
      />
      <path fill='#0b0d20' d='M8.8 10.5h6.4v1.2H8.8zM8.8 13.2h4.2v1.2H8.8z' />
    </svg>
  );
}
