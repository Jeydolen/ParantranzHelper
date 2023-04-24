
// DeepL API
class DeepL {
    #deepL_headers;
    #deepL_enabled = true;

    constructor(deepl_api_key, deepl_api_endpoint, deepl_enabled) {
        this.DEEPL_API_KEY = deepl_api_key;
        this.DEEPL_API_ENDPOINT = deepl_api_endpoint;

        if (typeof deepl_enabled === "boolean") {
            this.#deepL_enabled = deepl_enabled;
        }

        this.#deepL_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'DeepL-Auth-Key ' + this.DEEPL_API_KEY,
        };
    };
    
    async getTranslation (stringToTranslate) {
        const deepL_fetch_options = {
            method: "POST",
            headers: this.#deepL_headers,
            body: JSON.stringify({text: [stringToTranslate], target_lang: "FR"}),
        };
    
        return fetch(this.DEEPL_API_ENDPOINT + "/translate", deepL_fetch_options)
            .then((res) => {
                // TODO handle HTTP 429: Too many requests and HTTP 456 Account limit reached
                if (res.status === 429 || res.status === 456) {
                    print("Error, deepL server limit reached ! Try again later or upgrade to paid plan.");
                    this.#deepL_enabled = false;
                    return undefined;
                }
                return res;
            })
            .then((res) => res.json())
            .catch((err) => undefined);
    };

    status = () => this.#deepL_enabled;
    
};

exports.DeepL = DeepL;
// DeepL API