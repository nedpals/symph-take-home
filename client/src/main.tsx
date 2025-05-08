import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import SecondPage from "./pages/SecondPage";
import Layout from "./components/Layout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/second" element={<SecondPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
);
