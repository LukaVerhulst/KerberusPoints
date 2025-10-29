import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext' // <-- added

const Header = () => {
  const { isAuthenticated, logout } = useAppContext(); // <-- added

  return (
    <header className="w-full fixed top-0 left-0 z-20 bg-white border-b border-gray-300">
      <div className="w-full relative flex items-center px-6 md:px-8 lg:px-12 xl:px-16 py-4">
        {/* left logo */}
        <div className="shrink-0">
          <img className="h-9" src={assets.kerberus_logo} alt="logo" />
        </div>

        {/* centered title */}
        <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-base md:text-lg lg:text-xl font-semibold text-gray-800">
          Kerberus Schachten Punten Leaderboard
        </h1>

        {/* right side logout */}
        <div className="ml-auto">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-5 py-2 text-sm bg-red-600 text-white rounded"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Header