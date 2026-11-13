import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Curate from "./routes/Curate";
import Landing from "./routes/Landing";
import { PATHS } from "./routes/paths";
import Screen from "./routes/Screen";
import Site from "./routes/Site";

// Lazy so phones on the other routes never download Recharts.
const Pulse = lazy(() => import("./routes/Pulse"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PATHS.landing} element={<Landing />} />
        <Route path={PATHS.site} element={<Site />} />
        <Route path={PATHS.screen} element={<Screen />} />
        <Route path={PATHS.pulse} element={
            <Suspense fallback={null}>
              <Pulse />
            </Suspense>
          } />
        <Route path={PATHS.curate} element={<Curate />} />
        <Route path="*" element={<Navigate to={PATHS.landing} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
