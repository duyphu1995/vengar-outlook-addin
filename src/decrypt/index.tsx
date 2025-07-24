import { BaseResource } from "@ebi/api-client";
import { ConfigProvider, StorageProvider } from "@ebi/hooks";

import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { CacheProvider } from "rest-hooks";

import App from "../App";
import { VConfigApp } from "../ultils/VUltils";
import strings from "../strings";

// eslint-disable-next-line no-undef
BaseResource.apiUrl = process.env.REACT_APP_API_URL;

function LoadingFallback() {
  return null;
}

function AppContainer() {
  return (
    <CacheProvider>
      <ConfigProvider config={VConfigApp()}>
        <StorageProvider storage={localStorage}>
          <Router>
            <App /> {/* Now, App is wrapped in Provider and hence can read from store */}
          </Router>
        </StorageProvider>
      </ConfigProvider>
    </CacheProvider>
  );
}

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

/* Render application after Office initializes */
Office.onReady(() => {
  console.log("Office is ready!");

  localStorage.setItem(strings.LS_DEVICE_PLATFORM, Office.context?.diagnostics.platform.toString());
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <AppContainer />
      </Suspense>
    </React.StrictMode>
  );
});
