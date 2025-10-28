import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="text-default min-h-screen flex flex-col text-gray-700 bg-white">

      <Toaster />

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>

      </div>
    </div>
  );
}

export default App;
