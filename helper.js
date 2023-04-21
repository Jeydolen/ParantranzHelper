const readline = require("readline");
const fs = require("node:fs/promises");



// ░█████╗░░█████╗░███╗░░██╗███████╗██╗░██████╗░██╗░░░██╗██████╗░░█████╗░████████╗██╗░█████╗░███╗░░██╗
// ██╔══██╗██╔══██╗████╗░██║██╔════╝██║██╔════╝░██║░░░██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║
// ██║░░╚═╝██║░░██║██╔██╗██║█████╗░░██║██║░░██╗░██║░░░██║██████╔╝███████║░░░██║░░░██║██║░░██║██╔██╗██║
// ██║░░██╗██║░░██║██║╚████║██╔══╝░░██║██║░░╚██╗██║░░░██║██╔══██╗██╔══██║░░░██║░░░██║██║░░██║██║╚████║
// ╚█████╔╝╚█████╔╝██║░╚███║██║░░░░░██║╚██████╔╝╚██████╔╝██║░░██║██║░░██║░░░██║░░░██║╚█████╔╝██║░╚███║
// ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░░░░╚═╝░╚═════╝░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝

// API Key Paratranz
const pt_api_key = "";
// Paratranz API endpoint
const pt_api_endpoint = "https://paratranz.cn/api";

// Change this if you don't want to type your project id everytime
let pt_project_id;

// API Key DeepL
const dl_api_key = "";
// DeepL API endpoint
const dl_api_endpoint = "https://api-free.deepl.com/v2";

// CK3 Original game path
const game_path = "C:/Games/Crusader Kings III";

// Must be a language available in original game localization folder
const language = "french";

// Array of file names to ignore
const file_blacklist = [

];



// ██████╗░██████╗░░█████╗░░██████╗░██████╗░░█████╗░███╗░░░███╗
// ██╔══██╗██╔══██╗██╔══██╗██╔════╝░██╔══██╗██╔══██╗████╗░████║
// ██████╔╝██████╔╝██║░░██║██║░░██╗░██████╔╝███████║██╔████╔██║
// ██╔═══╝░██╔══██╗██║░░██║██║░░╚██╗██╔══██╗██╔══██║██║╚██╔╝██║
// ██║░░░░░██║░░██║╚█████╔╝╚██████╔╝██║░░██║██║░░██║██║░╚═╝░██║
// ╚═╝░░░░░╚═╝░░╚═╝░╚════╝░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░░░░╚═╝

// Please if you are not a developer do NOT go further this line
const print = console.log;

if (process.version.split(".")[0] < "18") {
    console.warn("Warning! Your node version might need to install some modules to be able to work correctly (eg: fetch)");
}

const deepL_enabled = !(typeof dl_api_key !== "string" || dl_api_key.length === 0);
const checkStartupConfiguration = () => {
    if (typeof pt_api_key !== "string" 
    || typeof game_path !== "string" 
    || typeof pt_api_endpoint !== "string"
    || pt_api_key.length === 0 
    || game_path.length === 0 
    || pt_api_endpoint.length === 0) {
        console.error("Error ! You have to set your game path, your paratranz api key and the paratranz api endpoint.");
        process.exit(1);
    }


    const pid = pt_project_id;
    if ((pid !== undefined && (typeof pid !== "string" && typeof pid !== "number"))) {
        console.error("Error ! Value for pt_project_id must be either undefined, a string, or a valid number.");
        process.exit(2);
    }

    if (file_blacklist === undefined || ! Array.isArray(file_blacklist)) {
        console.error("Error ! file_blacklist must be an array.")
        process.exit(3);
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
    'Authorization': pt_api_key,
  },
};

const queryApi = (path) => {
    return fetch(pt_api_endpoint + path, pt_fetch_options)
        .then(res => res.json());
};

const putTranslation = (string_id, translation) => {
    const put_opt = { ...pt_fetch_options};
    put_opt.method = "PUT";
    put_opt.body = JSON.stringify({translation});
    
    return fetch(pt_api_endpoint + "/projects/" + pt_project_id + "/strings/" + string_id, put_opt );
};
// Paratranz API

// DeepL API
const deepL_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'DeepL-Auth-Key ' + dl_api_key,
};

const getTranslationFromDeepL = async (stringToTranslate) => {
    const deepL_fetch_options = {
        method: "POST",
        headers: deepL_headers,
        body: JSON.stringify({text: [stringToTranslate], target_lang: language.substring(0, 2).toUpperCase()}),
    };

    return fetch(dl_api_endpoint + "/translate", deepL_fetch_options)
        .then((res) => res.json());
};

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
    if (pt_project_id !== undefined) { return; }

    const answer = await askQuestion("Project id: ");
    const answerInt = Number.parseInt(answer);

    if (! Number.isNaN(answerInt) && project_ids.includes(answerInt)) {
        pt_project_id = answer;
    } else {
        console.error("This is not a number from the list");
        askPID(project_ids);
    }
};

let pageCount = 1;
const getStringsToTranslate = async (page = 1) => {
    if (pt_project_id === undefined) {
        return;
    }

    // 1000 is the maximum item count per page
    const itemCount = 1000;
    const untranslatedStrings = await queryApi("/projects/" + pt_project_id + "/strings?stage=0&page=" + page + "&pageSize=" + itemCount);
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
const lookInFiles = async (path = game_path + "/game/localization/english") => {
    const directory = await fs.readdir(path, {withFileTypes: true});

    for (const dirEnt of directory) {
        if (dirEnt.isFile()) {
            filesInDirectory.push(dirEnt.name);

            filesStructureInDirectory.push(path.split(game_path)[1] + "/" + dirEnt.name);
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
        path = "/game/localization/english/" + path;
        
    }

    path = path.replaceAll("english", language);
    
    try {
        const file = await fs.readFile(game_path + path, {encoding: "utf8"});
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
    const ans = await askQuestion("Validation translation ? Y/n\n");
    const ansLower = ans.toLowerCase();

    if (ansLower == "y" || ansLower == "n") {
        return ansLower === "y" ? true : false;
    }

    validateTranslation();
}

const initApp = async () => {
    const p_list = await queryApi("/projects");
    if (pt_project_id === undefined) {
        print("\nSelect a project id from this list: \n");
        p_list.results.forEach(element => {
            print(element.id + " " + element.name)
        });
       
        await askPID(p_list.results.map((el) => el.id));    
    }
    else {
        const project = p_list.results.find((el) => el.id === pt_project_id);
        print("Project selected: " + project.id + " " + project.name);
    }

    for (let i = 0; i < pageCount; i++) {
        print("\x1b[33m", "Page : ", i, "\x1b[0m");
        const untranslatedStrings = await getStringsToTranslate(i);

        for (const stringToTranslate of untranslatedStrings.results) {
            const { key, original, translation, id } = stringToTranslate;
            const filename = stringToTranslate.file.name;

            // File blacklist
            if (file_blacklist.includes(filename)) {
                continue;
            }

            //Check if filename exists in original files
            const file = await getFileFromGameFiles(filename);
            if (file) {
                const trad = await getTranslationFromGameFile(file, key);

                if (trad !== false) {
                    print("Original: ", original, " traduction:", trad);
                    if (trad !== undefined) {
                        putTranslation(id, trad);
                    } else {
                        print("No trad found for: ", original, " in ", filename)
                    }

                }
            } else {
                if (deepL_enabled) {
                    // TODO: Ask deepL for traduction
                    // then ask user to validate or not traduction
                    // TODO handle HTTP 429: Too many requests and HTTP 456 Account limit reached
                    const specialChars =/[`@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/;
                    const containsSpecialChars = specialChars.test(original);
                    
                    if (containsSpecialChars) {
                        continue;
                    }

                    print("From file: " + filename + " key: " + key );
                    print("Original text : " + original);

                    const translation = await getTranslationFromDeepL(original);
                    
                    if (translation !== undefined) {
                        print(translation.translations[0].text);
                        const yn = await validateTranslation();
                        
                        if (yn) {
                            putTranslation(id, translation.translations[0].text);
                        }

                    }                    

                }
            }
        }

        copyGameKeywords(untranslatedStrings);
    }

};

initApp();
