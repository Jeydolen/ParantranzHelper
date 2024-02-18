const {
    print, getStartupConfiguration,
    FILE_WHITELIST, FILE_BLACKLIST,
    USE_PARADOX_GAME_FILES,
    USE_EXTERNAL_TRANSLATION_TOOLS,
    Readline
} = require("./config");

const handleString = async (stringToTranslate, DeepL, Paradox) => {
    const { key, original, id } = stringToTranslate;
    const filename = stringToTranslate.file.name;

    if (USE_PARADOX_GAME_FILES) {
        const translation = Paradox.getOfficialTranslation(filename, key, original);
        if (translation) {
            print("Original: ", original, "\ntranslation: ", translation);

            await ParaTranz.putTranslation(id, translation);
            return;
        }
    }

    if (!USE_EXTERNAL_TRANSLATION_TOOLS) {
        return;
    }

    if (DeepL.status()) {
        const specialChars = /[`@#$^&*_\-+=\[\]{}|<>\/?~]/;
        const containsSpecialChars = specialChars.test(original);

        // Not supporting special chars right now
        // It is too much prone to errors
        if (containsSpecialChars) {
            return;
        }

        print("From file: " + filename + " key: " + key);
        print("Original text : " + original);

        const translationObj = await DeepL.getTranslation(original);
        if (translationObj === undefined) {
            return;
        }

        const translationText = translationObj.translations[0].text;

        print("\nDeepL translation: ", translationText);
        const confirmation = await Readline.validateTranslation();

        if (confirmation === 1) {
            // Push translation to ParaTranz
            await ParaTranz.putTranslation(id, translationText);

            // Add to cache for further use
            cached_strings[original] = translationText;
        }
        else if (confirmation === 0) {
            // Add to ignore list
            filtered_strings.push(original);
        } else {
            // Rewrite
            const rewritten = await Readline.rewriteTranslation(translationText);

            // Push rewritten
            await ParaTranz.putTranslation(id, rewritten);

            // Add to cache for further use
            cached_strings[original] = rewritten;
        }
    } else {
        //Google translate or any other free translation api
    }
};


const handleFileList = (FILE_ARRAY, filename) => {
    let is_in_list = false;
    for (const file_name_el of FILE_ARRAY) {
        if (file_name_el.endsWith("/")) {
            // Means that it's a folder which is blacklisted
            const substr = filename.substring(0, filename.lastIndexOf("/"));
            if (file_name_el === substr + "/") {
                is_in_list = true;
            }
        } else if (file_name_el === filename) {
            is_in_list = true;
        }
    }

    return is_in_list;
}

const cached_strings = {};
const filtered_strings = [];
const handleStrings = async (strings, DeepL, Paradox) => {
    if (strings === undefined) {
        console.error("There is an error with the ParaTranz API, please check your configuration or try again later");
        process.exit(6);
    }

    for (let i = 0; i < strings.length; i++) {
        const stringToTranslate = strings[i];
        const { original, id } = stringToTranslate;
        const filename = stringToTranslate.file.name;

        // File WL
        const is_wl = handleFileList(FILE_WHITELIST, filename);
        if (FILE_WHITELIST.length > 0 && !is_wl) {
            continue;
        }

        // File blacklist
        const is_bl = handleFileList(FILE_BLACKLIST, filename);
        if (FILE_BLACKLIST.length > 0 && is_bl) {
            continue;
        }

        // String blacklist
        if (filtered_strings.includes(original)) {
            print(original, " is blacklisted ignoring");
            continue;
        }

        // String cache
        if (Object.keys(cached_strings).includes(original)) {
            print(original, " already translated: ", cached_strings[original]);
            await ParaTranz.putTranslation(id, cached_strings[original]);
            continue;
        }

        // Game keyword
        if (Paradox !== undefined && Paradox.copyGameKeyword(original)) {
            print(original, "is a game keyword automatic translation");
            await ParaTranz.putTranslation(id, original);
            continue;
        }

        await handleString(stringToTranslate, DeepL, Paradox);
    }

};

const initApp = async () => {
    const { ParaTranz, DeepL, Paradox } = await getStartupConfiguration();

    const select_project_result = await ParaTranz.selectProject();
    if (!select_project_result) {
        console.log("No more projects, exiting...");
        process.exit(6);
    }

    const pageCount = await ParaTranz.getStringsTotalPageCount();
    print("Page count: " + pageCount);
    for (let j = 1; j <= pageCount; j++) {
        print("\x1b[33m", `Page: ${j}`, "\x1b[0m");
        await handleStrings(await ParaTranz.getStringsToTranslate(j), DeepL, Paradox);
    }

    // Force exit because, I don't know why 
    // it doesn't happen otherwise
    process.exit(0);
};

initApp();