import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Curate from "./routes/Curate";
import Landing from "./routes/Landing";
import { PATHS } from "./routes/paths";
import Pulse from "./routes/Pulse";
import Screen from "./routes/Screen";
import Site from "./routes/Site";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PATHS.landing} element={<Landing />} />
        <Route path={PATHS.site} element={<Site />} />
        <Route path={PATHS.screen} element={<Screen />} />
        <Route path={PATHS.pulse} element={<Pulse />} />
        <Route path={PATHS.curate} element={<Curate />} />
        <Route path="*" element={<Navigate to={PATHS.landing} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
