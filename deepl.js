
class DeepL {
    #deepL_headers;
    #deepL_enabled = true;

    constructor(deepl_api_key, deepl_api_endpoint) {
        this.DEEPL_API_KEY = deepl_api_key;
        this.DEEPL_API_ENDPOINT = deepl_api_endpoint;

        this.#deepL_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'DeepL-Auth-Key ' + this.DEEPL_API_KEY,
        };
    };

    async checkUsage() {
        const res = await this.deeplRequest("/usage");
        if (res.character_count < res.character_limit) {
            return true;
        }

        return false;
    }

    async getTranslation(stringToTranslate) {
        const body = JSON.stringify({ text: [stringToTranslate], target_lang: "FR" });

        return await this.deeplRequest("/translate", body)
            .catch((err) => {
                console.log(err);
                return undefined;
            });
    };

    async deeplRequest(path, body) {
        const deepL_fetch_options = {
            method: "POST",
            headers: this.#deepL_headers,
            body
        };


        return fetch(this.DEEPL_API_ENDPOINT + path, deepL_fetch_options)
            .then((res) => {
                // HTTP 429: Too many requests and HTTP 456 Account limit reached
                if (res.status === 429 || res.status === 456) {
                    this.#deepL_enabled = false;
                    throw new Error("DeepL server limit reached ! Try again later or upgrade to paid plan.");
                }

                if (!res.ok) {
                    this.#deepL_enabled = false;
                    throw new Error("Unknown error :" + res.status + " " + res.statusText);
                }

                return res;
            })
            .then((res) => res.json())
    }

    status = () => this.#deepL_enabled;

};

exports.DeepL = DeepL;