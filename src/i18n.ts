// namespace format: "namspace.language"
export type NamespaceString<SupportedLanguage extends string> = `${string}.${SupportedLanguage}`;

type Key = string | number; // use alias for prevent typescript transformer bug

/**
 * const i18n = new I18n(
 *     {
 *         "en": {
 *             "default": () => import("@path/to/resource/default.en.ts"),
 *             "editor": () => import("@path/to/resource/editor.en.ts"),
 *             "game": () => import("@path/to/resource/game.en.ts")
 *         },
 *         "ko": {
 *             "default": () => import("@path/to/resource/default.ko.ts"),
 *             "editor": () => import("@path/to/resource/editor.ko.ts"),
 *             "game": () => import("@path/to/resource/game.ko.ts")
 *         },
 *         "ja": {
 *             "default": () => import("@path/to/resource/default.ja.ts"),
 *             "editor": () => import("@path/to/resource/editor.ja.ts")
 *         }
 *     },
 *     {
 *         defaultLanguage: "en",
 *         logger: console,
 *         fallbackText: "?"
 *     }
 * );
 */

/**
 * Resource file format
 */
export interface I18nData {
    default: { [key: Key]: string };
    dynamic: { [key: string]: string };
}

interface I18nLanguageDataItem {
    [namespace: string]: () => Promise<I18nData>;
}

// get key from object
type KeyOf<T> = Extract<keyof T, string>;

export interface I18nLanguageData {
    [key: string]: I18nLanguageDataItem;
};

export interface Logger {
    log(message: string): void;
}

export interface I18nCreationOptions<SupportedLanguage extends string = string> {
    defaultLanguage?: SupportedLanguage;
    logger?: Logger;
    fallbackText?: string;
    onTableLoaded?: (namespace: string, language: SupportedLanguage) => void;
}

/** I18NCONSTRUCTORSYMBOL */
export class I18n<LanguageData extends I18nLanguageData = I18nLanguageData, SupportedLanguage extends string = KeyOf<LanguageData>> {
    private readonly _languageData: LanguageData;
    private readonly _supportedLanguages: SupportedLanguage[];
    private readonly _defaultLanguage: SupportedLanguage;
    private _language: SupportedLanguage;

    private readonly _tables: Map<NamespaceString<SupportedLanguage>, { [key: string]: string }>; // namespace -> key -> value
    private readonly _dynamicTables: Map<NamespaceString<SupportedLanguage>, { [key: string]: string }>; // namespace -> key -> value

    private readonly _logger: Logger;
    private readonly _fallbackText: string;
    private readonly _onTableLoaded?: (namespace: string, language: SupportedLanguage) => void;

    public constructor(
        languageData: LanguageData,
        options: I18nCreationOptions<NoInfer<SupportedLanguage>> = {}
    ) {
        this._languageData = languageData;
        this._supportedLanguages = Object.keys(languageData) as SupportedLanguage[];
        this._defaultLanguage = options.defaultLanguage ?? this._supportedLanguages[0];
        this._language = this._defaultLanguage;

        this._tables = new Map();
        this._dynamicTables = new Map();

        const {
            logger = console,
            fallbackText = "",
            onTableLoaded
        } = options;

        this._logger = logger;
        this._fallbackText = fallbackText;
        this._onTableLoaded = onTableLoaded;
    }

    private async _loadLanguageTable(
        language: SupportedLanguage,
        namespace: string = "default"
    ): Promise<[
        Map<NamespaceString<SupportedLanguage>, { [key: Key]: string }>,
        Map<NamespaceString<SupportedLanguage>, { [key: string]: string }>
    ]> {
        const tables = new Map<NamespaceString<SupportedLanguage>, { [key: Key]: string }>();
        const dynamicTables = new Map<NamespaceString<SupportedLanguage>, { [key: string]: string }>();

        const key = namespace + "." + language as NamespaceString<SupportedLanguage>;

        const table = await this._languageData[language][namespace]();
        tables.set(key, table.default);
        dynamicTables.set(key, table.dynamic);

        return [tables, dynamicTables];
    }

    public setLanguage(
        language: SupportedLanguage
    ): void {
        if (this._supportedLanguages.includes(language) === false) {
            language = this._defaultLanguage;
        }

        if (this._language === language) {
            return;
        }
        this._language = language;
    }

    public getLanguage(): SupportedLanguage {
        return this._language;
    }

    public unloadUnusedLanguages(): void {
        for (const ns of this._tables.keys()) {
            if (!ns.endsWith(this._language)) {
                this._tables.delete(ns);
            }
        }
        for (const ns of this._dynamicTables.keys()) {
            if (!ns.endsWith(this._language)) {
                this._dynamicTables.delete(ns);
            }
        }
    }

    public async prefetchLanguageTable(
        language: SupportedLanguage,
        namespace: string = "default"
    ): Promise<void> {
        const [table, dynamicTable] = await this._loadLanguageTable(language, namespace);
        for (const [key, value] of table) {
            this._tables.set(key, value);
        }
        for (const [key, value] of dynamicTable) {
            this._dynamicTables.set(key, value);
        }
        this._onTableLoaded?.(namespace, language);
    }

    /** I18NNSLOCTEXTSYMBOL */
    public nslocText(ns: string, key: Key, ...args: any[]): string {
        return this._locText(false, ns, key, ...args);
    }

    /** I18NLOCTEXTSYMBOL */
    public locText(key: Key, ...args: any[]): string {
        return this._locText(false, "default", key, ...args);
    }

    public dNslocText(ns: string, key: Key, ...args: any[]): string {
        return this._locText(true, ns, key, ...args);
    }

    public dLocText(key: Key, ...args: any[]): string {
        return this._locText(true, "default", key, ...args);
    }

    private _locText(dynamic: boolean, ns: string, key: Key, ...args: any[]): string {
        const tableData = (dynamic ? this._dynamicTables : this._tables)
            .get(ns + "." + this._language as NamespaceString<SupportedLanguage>);

        if (tableData === undefined) {
            if (this._languageData[this._language][ns] === undefined) {
                this._logger.log(`Table data not found for ${ns}.${this._language}, key: ${key}`);
            } else {
                this.prefetchLanguageTable(this._language, ns);
            }
            if (dynamic) {
                return this._interpolate(key.toString(), args);
            } else {
                return this._interpolate(this._fallbackText, args);
            }
        }

        const value = tableData[key];
        if (value === undefined) {
            this._logger.log(`Key not found for ${ns}.${this._language}, key: ${key}`);
            if (dynamic) {
                return this._interpolate(key.toString(), args);
            } else {
                return this._interpolate(this._fallbackText, args);
            }
        }
        return this._interpolate(value, args);
    }

    private _interpolate(value: string, args: any[]): string {
        return value.replace(/{(\d+)}/g, (match, number) => {
            const index = parseInt(number, 10);
            return typeof args[index] !== "undefined" ? args[index] : match;
        });
    }
}
