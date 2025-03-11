import React from "react";
import ReactDOM from "react-dom/client";
import type { I18nData } from "typescript-i18n-transformer/src/i18n";
import { I18n } from "typescript-i18n-transformer/src/i18n";

import { App } from "./App";

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
