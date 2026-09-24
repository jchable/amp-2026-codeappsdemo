import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { PowerProvider } from "./PowerProvider";
import App from "./App";
import { changeDeRoute, estRouteDoc } from "./routage";
import "./design-system/polices";
import "./design-system/styles.css";

// La doc n'a pas besoin de Power Platform et n'alourdit pas le bundle de l'app.
const PageDoc = lazy(() => import("./design-system/doc/PageDoc"));

window.addEventListener("hashchange", (e) => {
  if (changeDeRoute(e.oldURL, e.newURL)) window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {estRouteDoc(window.location.hash) ? (
      <Suspense fallback={<p>Chargement…</p>}>
        <PageDoc />
      </Suspense>
    ) : (
      <PowerProvider>
        <App />
      </PowerProvider>
    )}
  </StrictMode>
);
