import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Frigo', icon: '🧊' },
  { to: '/shop', label: 'Courses', icon: '🛒' },
]

/** Barre de navigation fixe en bas de l'écran pour passer du frigo aux courses. */
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {links.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end className="bottom-nav-link">
          <span className="bottom-nav-icon" aria-hidden="true">
            {icon}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
