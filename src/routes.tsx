import { BrowserRouter, Routes, Route } from "react-router-dom";
import Catalog from "./pages/Catalog";
import Builder from "./pages/Builder";
import Edit from "./components/Edit";
import Run from "./components/Run";
import Stats from "./pages/Stats";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/run/:id" element={<Run />} />
        <Route path="/questionnaire/:id/stats" element={<Stats />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
