import { Routes, Route, useLocation } from "react-router-dom";

import AuroraBackground from "./components/AuroraBackground";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Experience from "./pages/Experience/Experience";
import InvestmentComparison from "./pages/InvestmentComparison/InvestmentComparison";

export default function App() {
  const location = useLocation();

  // Green on Experience, pink everywhere else
  const isExperiencePage = location.pathname === "/experience";

  const auroraTheme = isExperiencePage ? "green" : "pink";

  return (
    <main className="relative min-h-screen text-[#493841]">
      {/* Dynamic aurora background */}
      <AuroraBackground variant={auroraTheme} />

      <div className="relative z-10">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/experience" element={<Experience />} />
          <Route
            path="/investment-comparison"
            element={<InvestmentComparison />}
          />
        </Routes>

        <footer className="py-12 text-center text-sm text-[#806D76]">
          made with ♡ by jessica le
        </footer>
      </div>
    </main>
  );
}
