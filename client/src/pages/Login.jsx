import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Login = () => {
  const { login } = useAppContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email.trim(), password)
  }

  return (
    <div className="relative min-h-screen">
      {/* background image (same as Home) */}
      <img
        src={assets.kerberus_schachten}
        alt="background"
        className="fixed inset-0 w-full h-full object-cover filter brightness-30"
        style={{ objectPosition: 'center 75%' }}
      />
      {/* optional darker overlay to improve contrast */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none" />

      {/* centered card (logo + form) */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-white/85 backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* logo area */}
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={assets.kerberus_logo}
              alt="Kerberus logo"
              className="w-36 md:w-48"
            />
          </div>

          {/* form area */}
          <form
            onSubmit={handleSubmit}
            className="w-full md:w-96 flex flex-col items-center justify-center gap-4"
          >
            <h2 className="text-3xl md:text-4xl text-gray-900 font-medium">Log in</h2>
            <p className="text-sm text-gray-600/90">Log in met uw admin gegevens om door te gaan.</p>

            <div className="w-full h-px bg-gray-400/60 my-3" />

            <div className="flex items-center w-full bg-transparent border border-gray-400/60 h-12 rounded-full overflow-hidden pl-4 gap-3">
              <img src={assets.mail_icon} alt="mail" className="w-5 h-5 opacity-75" />
              <input
                type="email"
                placeholder="E-mail"
                className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center w-full bg-transparent border border-gray-400/60 h-12 rounded-full overflow-hidden pl-4 gap-3">
              <img src={assets.lock_icon} alt="lock" className="w-5 h-5 opacity-75" />
              <input
                type="password"
                placeholder="Wachtwoord"
                className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full h-11 rounded-full text-white bg-primary-blue hover:opacity-95 transition-opacity"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login