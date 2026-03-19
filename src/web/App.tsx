import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProgramsPage from "./pages/ProgramsPage";
import ContactPage from "./pages/ContactPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
