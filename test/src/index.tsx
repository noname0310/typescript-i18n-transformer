import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import type { I18nData } from "./i18n";
import { I18n } from "./i18n";

const i18n = new I18n(
    {
        "en": {
            "default": (): Promise<I18nData> => import("./language/default.en")
        },
        "ko": {
            "default": (): Promise<I18nData> => import("./language/default.ko")
        }
    },
    {
        defaultLanguage: "en",
        logger: console,
        fallbackText: "?"
    }
);

i18n.prefetchLanguageTable("en").then(() => {
    console.log(i18n.locText("text"));
    console.log(i18n.dLocText("dynamicText"));
});

const reactDom = ReactDOM.createRoot(document.getElementById("root")!);
reactDom.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
