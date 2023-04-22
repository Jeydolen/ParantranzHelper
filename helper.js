const readline = require("readline");
const fs = require("node:fs/promises");
const config = require("./config.json");

console.log(config);


// ░█████╗░░█████╗░███╗░░██╗███████╗██╗░██████╗░██╗░░░██╗██████╗░░█████╗░████████╗██╗░█████╗░███╗░░██╗
// ██╔══██╗██╔══██╗████╗░██║██╔════╝██║██╔════╝░██║░░░██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║
// ██║░░╚═╝██║░░██║██╔██╗██║█████╗░░██║██║░░██╗░██║░░░██║██████╔╝███████║░░░██║░░░██║██║░░██║██╔██╗██║
// ██║░░██╗██║░░██║██║╚████║██╔══╝░░██║██║░░╚██╗██║░░░██║██╔══██╗██╔══██║░░░██║░░░██║██║░░██║██║╚████║
// ╚█████╔╝╚█████╔╝██║░╚███║██║░░░░░██║╚██████╔╝╚██████╔╝██║░░██║██║░░██║░░░██║░░░██║╚█████╔╝██║░╚███║
// ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░░░░╚═╝░╚═════╝░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝

// API Key Paratranz
const PARATRANZ_API_KEY = config.paratranz_api_key;
// Paratranz API endpoint
const PARATRANZ_API_ENDPOINT = config.paratranz_api_endpoint;
// Change this if you don't want to type your project id everytime
let PARATRANZ_PROJECT_ID = config.parantranz_project_id;

// API Key DeepL
const DEEPL_API_KEY = config.deepl_api_key;
// DeepL API endpoint
const DEEPL_API_ENDPOINT = config.deepl_api_endpoint;

// Use game files, if set to true you need to set game_path to a valid Paradox game folder.
const USE_PARADOX_GAME_FILES = config.use_paradox_game_files || false;
// CK3 Original game path
const PARADOX_GAME_PATH = config.paradox_game_path || "";


// Must be a language available in original game localization folder
const TARGET_LANG = config.target_language;

// Array of file names to ignore
const FILE_BLACKLIST = config.paratranz_files_blacklist;

const FILE_WHITELIST = config.paratranz_files_whitelist;




// ██████╗░██████╗░░█████╗░░██████╗░██████╗░░█████╗░███╗░░░███╗
// ██╔══██╗██╔══██╗██╔══██╗██╔════╝░██╔══██╗██╔══██╗████╗░████║
// ██████╔╝██████╔╝██║░░██║██║░░██╗░██████╔╝███████║██╔████╔██║
// ██╔═══╝░██╔══██╗██║░░██║██║░░╚██╗██╔══██╗██╔══██║██║╚██╔╝██║
// ██║░░░░░██║░░██║╚█████╔╝╚██████╔╝██║░░██║██║░░██║██║░╚═╝░██║
// ╚═╝░░░░░╚═╝░░╚═╝░╚════╝░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░░░░╚═╝

// Please if you are not a developer do NOT go further this line
const print = console.log;

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

// Paratranz API
const pt_fetch_options = {
    headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': PARATRANZ_API_KEY,
  },
};

const queryParatranzAPI = (path) => {
    return fetch(PARATRANZ_API_ENDPOINT + path, pt_fetch_options)
        .then(res => res.json());
};

const putTranslation = (string_id, translation) => {
    const put_opt = { ...pt_fetch_options};
    put_opt.method = "PUT";
    put_opt.body = JSON.stringify({translation});
    
    return fetch(PARATRANZ_API_ENDPOINT + "/projects/" + PARATRANZ_PROJECT_ID + "/strings/" + string_id, put_opt );
};
// Paratranz API

// DeepL API
const deepL_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'DeepL-Auth-Key ' + DEEPL_API_KEY,
};

const getTranslationFromDeepL = async (stringToTranslate) => {
    const deepL_fetch_options = {
        method: "POST",
        headers: deepL_headers,
        body: JSON.stringify({text: [stringToTranslate], target_lang: "FR"}),
    };

    return fetch(DEEPL_API_ENDPOINT + "/translate", deepL_fetch_options)
        .then((res) => {
            // TODO handle HTTP 429: Too many requests and HTTP 456 Account limit reached
            if (res.status === 429 || res.status === 456) {
                print("Error, deepL server limit reached ! Try again later or upgrade to paid plan.");
                deepL_enabled = false;
                return undefined;
            }
            return res;
        })
        .then((res) => res.json());
};
// DeepL API

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
};

const isFirstAndLastCharacterSame = (string, character) => {
    return (string.startsWith(character) && string.endsWith(character));
};

const askPID = async (project_ids) => {
    if (PARATRANZ_PROJECT_ID !== undefined) { return; }

    const answer = await askQuestion("Project id: ");
    const answerInt = Number.parseInt(answer);

    if (! Number.isNaN(answerInt) && project_ids.includes(answerInt)) {
        PARATRANZ_PROJECT_ID = answer;
    } else {
        console.error("This is not a number from the list");
        askPID(project_ids);
    }
};

let pageCount = 1;
const getStringsToTranslate = async (page = 1) => {
    if (PARATRANZ_PROJECT_ID === undefined) {
        return;
    }

    // 1000 is the maximum item count per page
    const itemCount = 1000;
    const untranslatedStrings = await queryParatranzAPI("/projects/" + PARATRANZ_PROJECT_ID + "/strings?stage=0&page=" + page + "&pageSize=" + itemCount);
    pageCount = untranslatedStrings.pageCount;

    return untranslatedStrings;
};

// It is only working for translation of 1 words
const copyGameKeywords = async (untranslatedStrings) => {
    for (const object of untranslatedStrings.results) {
        const str = object.original;
        const stringArr = object.original.split(" ");

        if (stringArr.length === 1) {
            // These are reserved keywords in paradox games so you dont have to translate them
            if (isFirstAndLastCharacterSame(str, "$") || (str.startsWith("[") && str.endsWith("]"))) {
                print("Automatic translation game keyword: ", str);
                putTranslation(object.id, str);
            }
        }
    }
};

const filesInDirectory = [];
const filesStructureInDirectory = [];
const lookInFiles = async (path = PARADOX_GAME_PATH + "/game/localization/english") => {
    const directory = await fs.readdir(path, {withFileTypes: true});

    for (const dirEnt of directory) {
        if (dirEnt.isFile()) {
            filesInDirectory.push(dirEnt.name);

            filesStructureInDirectory.push(path.split(PARADOX_GAME_PATH)[1] + "/" + dirEnt.name);
        }
        else if (dirEnt.isDirectory()) {
            lookInFiles(path + "/" + dirEnt.name);
        }
    }
};

const getFileFromGameFiles = async (file) => {
    if (filesInDirectory.length === 0) {
        await lookInFiles();
    }

    const fileToFind = filesStructureInDirectory.find((el) => el.endsWith(file));
    if (fileToFind !== undefined) {
        return fileToFind;
    }

    return false;
};

const getTranslationFromGameFile = async (path, key) => {
    if (path.startsWith("/game/localization/english/")) {
        path = path.split("/game/localization/english/")[1];
    }

    if (! path.startsWith("/")) {
        //Seems like there is some kind of bug
        // // return;
        // print("hapends", path)
        // process.exit()
        path = "/game/localization/english/" + path;
        
    }

    path = path.replaceAll("english", TARGET_LANG);
    
    try {
        const file = await fs.readFile(PARADOX_GAME_PATH + path, {encoding: "utf8"});
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

const validateTranslation = async () => {
    const ans = await askQuestion("Valid translation ? Y(es)/n(o)/r(ewrite)\n");
    const ansLower = ans.toLowerCase();

    switch (ansLower) {
        case "y": return 1;
        case "n": return 0;
        case "r": return -1;
        default: validateTranslation();
    }

    validateTranslation();
};

const initApp = async () => {
    const p_list = await queryParatranzAPI("/projects");
    if (PARATRANZ_PROJECT_ID === undefined) {
        print("\nSelect a project id from this list: \n");
        p_list.results.forEach(element => {
            print(element.id + " " + element.name);
        });
       
        await askPID(p_list.results.map((el) => el.id));    
    }
    else {
        const project = p_list.results.find((el) => el.id === Number.parseInt(PARATRANZ_PROJECT_ID));
        print("Project selected: " + project.id + " " + project.name);
    }

    const cached_words = {};
    const filtered_words = [];
    for (let i = 0; i < pageCount; i++) {
        print("\x1b[33m", "Page : ", i, "\x1b[0m");
        const untranslatedStrings = await getStringsToTranslate(i);

        for (const stringToTranslate of untranslatedStrings.results) {
            const { key, original, translation, id } = stringToTranslate;
            const filename = stringToTranslate.file.name;

            if (FILE_WHITELIST.length !== 0) {
                if (! FILE_WHITELIST.includes(filename)) {
                    continue;
                }
            }

            // File blacklist
            if (FILE_BLACKLIST.includes(filename)) {
                continue;
            }

            // Word blacklist
            if (filtered_words.includes(original)) {
                print(original, " is blacklisted ignoring");
                continue;
            }

            if (Object.keys(cached_words).includes(original)) {
                // putTranslation(id, )
                print(original, " already translated: ", cached_words[original]);
                continue;
            }

            if (USE_PARADOX_GAME_FILES) {
                //Check if filename exists in original files
                const file = await getFileFromGameFiles(filename);
                if (file) {
                    const trad = await getTranslationFromGameFile(file, key);
    
                    if (trad !== false) {
                        print("Original: ", original, " traduction:", trad);
                        if (trad !== undefined) {
                            putTranslation(id, trad);
                            continue;
                        } else {
                            print("No translation found for: ", original, " in ", filename);
                        }
    
                    }

                }
            }

            if (deepL_enabled) {
                const specialChars =/[`@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/;
                const containsSpecialChars = specialChars.test(original);
                
                // Not supporting special chars right now
                // It is too much prone to errors
                if (containsSpecialChars) {
                    continue;
                }

                print("From file: " + filename + " key: " + key );
                print("Original text : " + original);

                const translation = await getTranslationFromDeepL(original);
                if (translation === undefined) {
                    continue;
                }
                
                print(translation.translations[0].text);
                const confirmation = await validateTranslation();
                
                if (confirmation === 1) {
                    // Push translation to ParaTranz
                    putTranslation(id, translation.translations[0].text);
                    
                    // Add to cache for further use
                    cached_words[original] = translation.translations[0].text;
                }
                else if (confirmation === 0) {
                    // Add to ignore list
                    filtered_words.push(original);
                } else {
                    // Rewrite
                    print("User chose to rewrite")
                }
            } else {
                //Google translate or any other free translation api
            }
        }

        copyGameKeywords(untranslatedStrings);
    }

};

initApp();