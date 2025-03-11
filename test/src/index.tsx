import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { I18nProvider } from "./I18n";

const reactDom = ReactDOM.createRoot(document.getElementById("root")!);
reactDom.render(
    <React.StrictMode>
        <I18nProvider>
            <App />
        </I18nProvider>
    </React.StrictMode>
);
