import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Agent from "./pages/Agent";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/agent" element={<Agent />} />
        {/* Yanlış sayfaya girilirse başa döndür */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}