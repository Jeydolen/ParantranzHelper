const fs = require("node:fs/promises");
const config = require("./config.json");

const print = console.log;


// API Key Paratranz
const PARATRANZ_API_KEY = config.paratranz_api_key;
// Paratranz API endpoint
const PARATRANZ_API_ENDPOINT = config.paratranz_api_endpoint;
// Change this if you don't want to type your project id everytime
let PARATRANZ_PROJECT_ID = config.parantranz_project_id;

if (typeof PARATRANZ_PROJECT_ID !== "string" || PARATRANZ_PROJECT_ID.length === 0) {
    PARATRANZ_PROJECT_ID = undefined;
}

// API Key DeepL
const DEEPL_API_KEY = config.deepl_api_key;
// DeepL API endpoint
const DEEPL_API_ENDPOINT = config.deepl_api_endpoint;

// Use game files, if set to true you need to set game_path to a valid Paradox game folder.
const USE_PARADOX_GAME_FILES = config.use_paradox_game_files || false;
// CK3 Original game path
const PARADOX_GAME_PATH = config.paradox_game_path || "";


// Must be a language available in original game localization folder
const SOURCE_LANG = config.source_language || "english";
const TARGET_LANG = config.target_language;

// Array of file names to ignore
const FILE_BLACKLIST = config.paratranz_files_blacklist;

const FILE_WHITELIST = config.paratranz_files_whitelist;


const NODE_MIN_SUPPORTED_VERSION = "18";
if (process.version.split(".")[0] < NODE_MIN_SUPPORTED_VERSION) {
    console.error(`Error ! Your node version does not support this program ! 
    Please upgrade your nodejs version to at least: ${NODE_MIN_SUPPORTED_VERSION}.
    Current node version: ${process.version}`);
    process.exit(0);
}

const deepL_enabled = !(typeof DEEPL_API_KEY !== "string" || DEEPL_API_KEY.length === 0);
const checkStartupConfiguration = () => {
    if (typeof PARATRANZ_API_KEY !== "string" 
    || typeof PARATRANZ_API_ENDPOINT !== "string"
    || PARATRANZ_API_KEY.length === 0 
    || PARATRANZ_API_ENDPOINT.length === 0) {
        console.error("Error ! You have to set your paratranz api key and the paratranz api endpoint.");
        process.exit(1);
    }

    const pid = PARATRANZ_PROJECT_ID;
    if ((pid !== undefined && (typeof pid !== "string" && typeof pid !== "number"))) {
        console.error("Error ! Value for paratranz_project_id must be either undefined, a string, or a valid number.");
        process.exit(2);
    }

    if (FILE_BLACKLIST === undefined || ! Array.isArray(FILE_BLACKLIST)) {
        console.error("Error ! file_blacklist must be an array.")
        process.exit(3);
    }

    if (FILE_WHITELIST === undefined || ! Array.isArray(FILE_WHITELIST)) {
        console.error("Error ! file_whitelist must be an array.")
        process.exit(4);
    }

    if (USE_PARADOX_GAME_FILES === true 
    && (typeof PARADOX_GAME_PATH !== "string" 
    || PARADOX_GAME_PATH.length === 0)) {
        console.error("Error ! Value for game_path must be a valid Paradox game folder !");
        process.exit(5);
    }

    if (! USE_PARADOX_GAME_FILES) {
        console.warn(`Warning ! You disabled access to your game files ! 
        This might be entirely normal but if that's not the case, 
        please enable use_game_files and set a valid Paradox game path for game_path.`);
    }

    if (! deepL_enabled) {
        console.warn("Warning ! DeepL recommandations won't work if you don't set an api key !");
    }
};

checkStartupConfiguration();

const ParaTranz = new (require("./paratranz").ParaTranz)
(PARATRANZ_PROJECT_ID, PARATRANZ_API_KEY, PARATRANZ_API_ENDPOINT);

const DeepL = new (require("./deepl").DeepL)
(DEEPL_API_KEY, DEEPL_API_ENDPOINT, deepL_enabled);

const Readline = new (require("./readline").Readline)();

const isFirstAndLastCharacterSame = (string, character) => {
    return (string.startsWith(character) && string.endsWith(character));
};

const getStringsToTranslate = async (page = 1, file_id) => {
    if (PARATRANZ_PROJECT_ID === undefined) {
        return;
    }

    const untranslatedStrings = await ParaTranz.getStringsForPage(page, file_id);
    return untranslatedStrings.results;
};

const handleString = async (stringToTranslate) => {
    const { key, original, id } = stringToTranslate;
    const filename = stringToTranslate.file.name;

    if (USE_PARADOX_GAME_FILES) {
        const translation = Paradox.getOfficialTranslation(filename, key, original);
        if (translation) {
            print("Original: ", original, " translation: ", translation);

            ParaTranz.putTranslation(id, translation);
            return;
        }
    }

    if (DeepL.status()) {
        const specialChars =/[`@#$^&*_\-+=\[\]{}|<>\/?~]/;
        const containsSpecialChars = specialChars.test(original);
        
        // Not supporting special chars right now
        // It is too much prone to errors
        if (containsSpecialChars) {
            return;
        }

        print("From file: " + filename + " key: " + key );
        print("Original text : " + original);

        const translationObj = await DeepL.getTranslation(original);
        if (translationObj === undefined) {
            return;
        }

        const translationText = translationObj.translations[0].text;
        
        print("DeepL translation: ", translationText);
        const confirmation = await Readline.validateTranslation();
        
        if (confirmation === 1) {
            // Push translation to ParaTranz
            ParaTranz.putTranslation(id, translationText);
            
            // Add to cache for further use
            cached_words[original] = translationText;
        }
        else if (confirmation === 0) {
            // Add to ignore list
            filtered_words.push(original);
        } else {
            // Rewrite
            const rewritten = await Readline.rewriteTranslation(translationText);

            // Push rewritten
            ParaTranz.putTranslation(id, rewritten);

            // Add to cache for further use
            cached_words[original] = rewritten;
        }
    } else {
        //Google translate or any other free translation api
    }
};


const cached_words = {};
const filtered_words = [];
const handleStrings = async (strings) => {
    if (strings === undefined) {
        console.error("There is an error with the ParaTranz API, please check your configuration or try again later");
        process.exit(6);
    }

    loop1:
    for (let i = 0; i < strings.length; i++) {
        const stringToTranslate = strings[i];
        const { original, id } = stringToTranslate;
        const filename = stringToTranslate.file.name;

        if (FILE_WHITELIST.length !== 0 && FILE_WHITELIST.includes(filename)) {
            continue;
        }

        loop2:
        for (const blacklist_el of FILE_BLACKLIST) {
            if (blacklist_el.endsWith("/")) {
                // Means that it's a folder which is blacklisted
                const substr = filename.substring(0, filename.lastIndexOf("/"));
                if (blacklist_el === substr + "/") {
                    continue loop1;
                }
            } else if (blacklist_el === filename) {
                continue loop1;
            }
        }
        
        // Word blacklist
        if (filtered_words.includes(original)) {
            print(original, " is blacklisted ignoring");
            continue;
        }
            
        // Word cache
        if (Object.keys(cached_words).includes(original)) {
            print(original, " already translated: ", cached_words[original]);
            ParaTranz.putTranslation(id, cached_words[original]);
            continue;
        }

        await handleString(stringToTranslate);
    }

    // Paradox.copyGameKeywords(untranslatedStrings);
    return;
};

let Paradox;
const initApp = async () => {
    const p_list = await ParaTranz.getProjects();
    if (PARATRANZ_PROJECT_ID === undefined) {
        print("\nSelect a project id from this list: \n");
        p_list.results.forEach(element => {
            print(element.id + " " + element.name);
        });
       
        PARATRANZ_PROJECT_ID = await Readline.askPID(p_list.results.map((el) => el.id));
        ParaTranz.setProjectId(PARATRANZ_PROJECT_ID);
    }
    else {
        const project = p_list.results.find((el) => el.id === Number.parseInt(PARATRANZ_PROJECT_ID));
        print("Project selected: " + project.id + " " + project.name);
    }

    if (USE_PARADOX_GAME_FILES) {
        Paradox = new (require("./paradox").Paradox)(PARADOX_GAME_PATH, SOURCE_LANG, TARGET_LANG);
        await Paradox.loadGameFiles();
    }

    const pageCount = await ParaTranz.getStringsTotalPageCount();
    print("Page count: " + pageCount);
    for (let j = 1; j <= pageCount; j++) {
        print("\x1b[33m", `Page: ${j}`, "\x1b[0m");
        await handleStrings(await getStringsToTranslate(j));
    }
    
    // Force exit because, I don't know why 
    //it doesn't happens otherwise
    process.exit(0); 
};

initApp();