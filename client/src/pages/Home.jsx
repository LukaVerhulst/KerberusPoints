import React from "react";
import { assets } from "../assets/assets";
import Header from "../components/Header";
import Leaderboard from "../components/Leaderboard";
import EditScorePanel from "../components/EditScorePanel/EditScorePanel";
import { generatePDF } from '../utils/generatePDF';
import { useAppContext } from "../context/AppContext";

const Home = () => {

  const { schachten } = useAppContext();

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <img
        src={assets.kerberus_schachten}
        alt="Kerberus"
        className="fixed inset-0 w-full h-full object-cover filter brightness-30"
        style={{ objectPosition: "center 75%" }}
      />

      <div className="relative z-10 pt-20 px-2">
        <Header />
        <div className="flex flex-col lg:flex-row justify-center gap-8 mt-6">
          {/* Leaderboard panel */}
          <div className="w-full lg:w-[65%] flex flex-col">
            <div className="flex-1 h-[88vh]">
              <Leaderboard />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => generatePDF(schachten, assets.kerberus_logoBase64)}
                className="px-4 py-2 rounded bg-white/6 hover:bg-white/10 text-white text-sm"
              >
                Download PDF
              </button>
            </div>
          </div>
        
          {/* EditScorePanel */}
          <div className="w-full lg:w-[30%] h-[88vh] mt-4 lg:mt-0">
            <EditScorePanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
