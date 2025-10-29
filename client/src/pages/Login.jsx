// ...existing code...
import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'

const Login = () => {
  const { login } = useAppContext()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email.trim(), password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-gray-50 p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Sign in</h2>

        <label className="block mb-2 text-sm text-gray-600">Email</label>
        <input
          className="w-full mb-3 px-3 py-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2 text-sm text-gray-600">Password</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login
// ...existing code...