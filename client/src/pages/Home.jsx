// ...existing code...
import React from 'react'
import { assets } from '../assets/assets'
import Header from '../components/Header'

const Home = () => {
  return (
    <div className="relative min-h-screen">
      {/* full-viewport background image (focus bottom so people are centered) */}
      <img
        src={assets.kerberus_schachten}
        alt="Kerberus"
        className="fixed inset-0 w-full h-full object-cover filter brightness-30"
        style={{ objectPosition: 'center 75%' }} // move vertical focal point down (change 75% as needed)
      />

      {/* page content above the image; pt-20 gives space for the fixed header */}
      <div className="relative z-10 pt-20">
        <Header />
        {/* your page content below header */}
      </div>
    </div>
  )
}

export default Home
// ...existing code...