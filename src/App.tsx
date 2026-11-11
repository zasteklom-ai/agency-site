import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { metrikaHit } from "./lib/metrika";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import CottageDetail from "./pages/CottageDetail";
import Events from "./pages/Events";
import Reviews from "./pages/Reviews";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import Admin from "./pages/Admin";

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // SPA-хиты для Яндекс.Метрики при каждом переходе между страницами
  useEffect(() => {
    metrikaHit(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/cottage/:id" element={<CottageDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}
