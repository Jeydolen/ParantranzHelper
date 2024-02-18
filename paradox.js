const fs = require("node:fs/promises");

class Paradox {
    #paths = {};
    #translations = {};

    constructor(game_path, source_language, target_language) {
        this.GAME_PATH = game_path;
        this.SOURCE_LANG = source_language;
        this.TARGET_LANG = target_language;
    }

    async loadGameFiles() {
        // Load all game files from both source and target languages.
        const base_path = `${this.GAME_PATH}/game/localization`;

        const paths = [this.SOURCE_LANG, this.TARGET_LANG];

        for (const pathToBuild of paths) {
            const path = `${base_path}/${pathToBuild}`;
            await this.getFilesFromPath(path, pathToBuild);
        };

        for (const lang of Object.keys(this.#paths)) {
            this.#translations[lang] = {};

            for (const path of this.#paths[lang]) {
                await this.loadFileFromPath(path, lang);
            }
        }
    };

    async getFilesFromPath(absolute_path, lang) {
        if (!Array.isArray(this.#paths[lang])) {
            this.#paths[lang] = [];
        }

        const directory = await fs.readdir(absolute_path, { withFileTypes: true });

        for (const dirEnt of directory) {
            if (dirEnt.isFile()) {
                this.#paths[lang].push(`${absolute_path}/${dirEnt.name}`);
                continue;
            }

            if (dirEnt.isDirectory()) {
                await this.getFilesFromPath(`${absolute_path}/${dirEnt.name}`, lang);
                continue;
            }
        }
    };

    async loadFileFromPath(path, lang) {
        const file = await fs.readFile(path, { encoding: "utf8" });
        const fileLines = file.split("\n");

        const translation_obj = fileLines
            .map((line) => line.trimStart())
            .map((line) => ({
                key: line.split(" ")[0],
                translation: line.split("\"")[1]
            }));

        this.#translations[lang][path.split(this.GAME_PATH)[1]] = translation_obj;
    };

    getOfficialTranslation(filename, key, original_text) {
        // /replace folder in ParaTranz project is for replacing partly official translation
        // by doing .replace() we filter them and check for exact text to replace not already translated one
        filename = filename.replace(`replace/${this.SOURCE_LANG}`, "");

        const source_translations = this.#translations
        [this.SOURCE_LANG]
        [Object.keys(this.#translations[this.SOURCE_LANG]).find((file) => file.endsWith(filename))];

        const target_filename = filename.replaceAll(this.SOURCE_LANG, this.TARGET_LANG);
        const target_translations = this.#translations
        [this.TARGET_LANG]
        [Object.keys(this.#translations[this.TARGET_LANG]).find((file) => file.endsWith(target_filename))];

        if (source_translations === undefined || target_translations === undefined) {
            return false;
        }

        const source = source_translations.find((el) => el.key.includes(key) && el.translation === original_text);

        if (source === undefined) {
            // Means there is no translation for this key with the exact original text
            return false;
        }

        const target = target_translations.find((el) => el.key.includes(key));

        return target.translation || false;
    }

    extractGameKeywords(string) {
        const gameKeywords = [];
        let gameKeyword = "";
        let isGameKeywordChar = false;
        for (let i = 0; i < string.length; i++) {
            const character = string[i];

            // Start of a game keyword
            if (character === "[") {
                isGameKeywordChar = true;
            }

            if (isGameKeywordChar) {
                gameKeyword += character;
            }

            if (character === "]") {
                isGameKeywordChar = false;
                gameKeywords.push(gameKeyword);
                gameKeyword = "";
            }
        }


        return gameKeywords;
    }

    copyGameKeyword(string) {
        const extractedKeywords = this.extractGameKeywords(string);

        let str = string;
        for (const keyword of extractedKeywords) {
            str = str.split(keyword).join("");
        }


        if (str.length === 0 || str === " ") {
            return true;
        }

        if (!string.includes(" ") &&
            ((string.startsWith("$") && string.endsWith("$"))
                || (string.startsWith("[") && string.endsWith("]")))
        ) {
            return true;
        }

        return false;
    }

    getTranslationFromGameFile = async (path, key) => {
        if (path.startsWith("/game/localization/english/")) {
            path = path.split("/game/localization/english/")[1];
        }

        if (!path.startsWith("/")) {
            path = "/game/localization/english/" + path;
        }

        path = path.replaceAll("english", TARGET_LANG);

        try {
            const file = await fs.readFile(PARADOX_GAME_PATH + path, { encoding: "utf8" });
            if (file === undefined) {
                return false;
            }

            const fileLines = file.split("\n");



            const line = fileLines.find((el) => el.includes(key));
            if (line !== undefined) {
                const trad = line.split('"')[1];
                if (trad !== undefined) {
                    return trad;
                }
            }

        } catch (e) {
            console.error(e);
        }

        return false;
    };
};

exports.Paradox = Paradox;
