import type { JSX } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { I18nData } from "typescript-i18n-transformer/i18n";
import { I18n } from "typescript-i18n-transformer/i18n";

interface I18nContext {
    value: I18n | undefined;
    updateId: number;
}

const I18nContext = createContext<I18nContext>({
    value: undefined,
    updateId: -1
});

export function useI18n(): I18n {
    return useContext(I18nContext).value!;
}

interface I18nProviderProps {
    children: JSX.Element;
}

export function I18nProvider(props: I18nProviderProps): JSX.Element {
    const { children } = props;

    const [i18n, setI18n] = useState<I18nContext>({
        value: undefined,
        updateId: -1
    });

    useEffect(() => {
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
                fallbackText: process.env.NODE_ENV === "development" ? null : "",
                onTableLoaded: (_namespace, _language): void => {
                    setI18n((prev) => ({
                        value: prev.value,
                        updateId: prev.updateId + 1
                    }));
                }
            }
        );
        setI18n({
            value: i18n,
            updateId: 0
        });
    }, []);

    return (
        <I18nContext.Provider value={i18n}>
            {i18n.value && children}
        </I18nContext.Provider>
    );
}
