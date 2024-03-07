const config = require("./config.json");
const { DeepL } = require("./deepl");
const { Paradox } = require("./paradox");
const { ParaTranz } = require("./paratranz");

const NODE_MIN_SUPPORTED_VERSION = 18;
if (process.version.split(".")[0] < NODE_MIN_SUPPORTED_VERSION) {
    console.error(`Error ! Your node version does not support this program ! 
    Please upgrade your nodejs version to at least: ${NODE_MIN_SUPPORTED_VERSION}.
    Current node version: ${process.version}`);
    process.exit(0);
}

const PARATRANZ_API_KEY = config.paratranz_api_key;
const PARATRANZ_API_ENDPOINT = config.paratranz_api_endpoint;
if (typeof PARATRANZ_API_KEY !== "string"
    || typeof PARATRANZ_API_ENDPOINT !== "string"
    || PARATRANZ_API_KEY.length === 0
    || PARATRANZ_API_ENDPOINT.length === 0) {
    console.error("Error ! You have to set your paratranz api key and the paratranz api endpoint.");
    process.exit(1);
}

// Change this if you don't want to type your project id everytime
let PARATRANZ_PROJECT_ID;
if (!Number.isNaN(parseInt(config.parantranz_project_id, 10))) {
    PARATRANZ_PROJECT_ID = parseInt(config.parantranz_project_id, 10);
}


const USE_EXTERNAL_TRANSLATION_TOOLS = config.use_external_translation_tools || false;

const DEEPL_API_KEY = config.deepl_api_key;
const DEEPL_API_ENDPOINT = config.deepl_api_endpoint;

// Use game files, if set to true you need to set game_path to a valid Paradox game folder.
const USE_PARADOX_GAME_FILES = config.use_paradox_game_files || false;

// CK3 Original game path
const PARADOX_GAME_PATH = config.paradox_game_path || "";

if (USE_PARADOX_GAME_FILES === true
    && (typeof PARADOX_GAME_PATH !== "string"
        || PARADOX_GAME_PATH.length === 0)) {
    console.error("Error ! Value for game_path must be a valid Paradox game folder !");
    process.exit(5);
}

if (!USE_PARADOX_GAME_FILES) {
    console.warn(`Warning ! You disabled access to your game files ! 
    This might be entirely normal but if that's not the case, 
    please enable use_game_files and set a valid Paradox game path for game_path.`);
}




// Must be a language available in original game localization folder
const SOURCE_LANG = config.source_language || "english";
const TARGET_LANG = config.target_language;

// Array of file names to ignore
const FILE_BLACKLIST = config.paratranz_files_blacklist;
if (FILE_BLACKLIST === undefined || !Array.isArray(FILE_BLACKLIST)) {
    console.error("Error ! file_blacklist must be an array.")
    process.exit(3);
}

const FILE_WHITELIST = config.paratranz_files_whitelist;
if (FILE_WHITELIST === undefined || !Array.isArray(FILE_WHITELIST)) {
    console.error("Error ! file_whitelist must be an array.")
    process.exit(4);
}

const Readline = new (require("./readline").Readline)();

async function getStartupConfiguration() {
    // Test paratranz endpoint + key
    const paratranz = new ParaTranz(PARATRANZ_PROJECT_ID, PARATRANZ_API_KEY, PARATRANZ_API_ENDPOINT, Readline);
    const paratranz_available = await paratranz.testEndpoint();
    if (!paratranz_available) {
        console.log("ParaTranz is unavailable, please check your configuration or retry later !");
        process.exit(1);
    }

    const export_object = { ParaTranz: paratranz };

    if (USE_EXTERNAL_TRANSLATION_TOOLS) {
        const deepl = new DeepL(DEEPL_API_KEY, DEEPL_API_ENDPOINT);
        const deepl_available = await deepl.checkUsage();
        if (!deepl_available) {
            console.log("DeepL is unavailable, please check your configuration or retry later !");
            process.exit(2);
        }

        export_object.DeepL = deepl;
    }

    if (USE_PARADOX_GAME_FILES) {
        const paradox = new Paradox(PARADOX_GAME_PATH, SOURCE_LANG, TARGET_LANG);
        // const files_loaded = await paradox.loadGameFiles();
        // if (files_loaded) {
        //     console.log("Paradox folder is unavailable, please check your configuration or retry later !");
        //     process.exit(3);
        // }

        export_object.Paradox = paradox;
    }

    return export_object;
};


exports.print = console.log;
exports.USE_PARADOX_GAME_FILES = USE_PARADOX_GAME_FILES;
exports.USE_EXTERNAL_TRANSLATION_TOOLS = USE_EXTERNAL_TRANSLATION_TOOLS;
exports.FILE_BLACKLIST = FILE_BLACKLIST;
exports.FILE_WHITELIST = FILE_WHITELIST;
exports.Readline = Readline;
exports.getStartupConfiguration = getStartupConfiguration;
