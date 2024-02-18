// Paratranz API
class ParaTranz {
    #pt_fetch_options;

    constructor(project_id, api_key, api_endpoint) {
        this.PARATRANZ_PROJECT_ID = project_id;
        this.PARATRANZ_API_KEY = api_key;
        this.PARATRANZ_API_ENDPOINT = api_endpoint;

        this.#pt_fetch_options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.PARATRANZ_API_KEY,
            },
        }
    };

    setProjectId(projectId) {
        if (!Number.isNaN(Number.parseInt(projectId))) {
            this.PARATRANZ_PROJECT_ID = projectId;
        }
    };

    queryParatranzAPI(path) {
        return fetch(this.PARATRANZ_API_ENDPOINT + path, this.#pt_fetch_options)
            .then(res => {
                if (!res.ok) {
                    throw Error("Paratranz returned " + res.statusText);
                }

                return res;
            })
            .then(res => res.json())
            .catch(err => { console.log(err); return undefined });
    };

    getProjects(page = 1) {
        return this.queryParatranzAPI("/projects?page=" + page);
    };

    getFiles() {
        return this.queryParatranzAPI(`/projects/${this.PARATRANZ_PROJECT_ID}/files`);
    }

    getStringsForPage(page, file_id) {
        // 1000 is the maximum item count per page
        const itemCount = 1000;
        let url = `/projects/${this.PARATRANZ_PROJECT_ID}/strings?stage=0&page=${page}&pageSize=${itemCount}`;

        if (file_id !== undefined) {
            url += "&file=" + file_id;
        }

        return this.queryParatranzAPI(url);
    };

    async getStringsTotalPageCount() {
        const result = await this.getStringsForPage(0);
        if (result === undefined) {
            return 0;
        }

        return result.pageCount;
    }

    putTranslation(string_id, translation) {
        const put_opt = { ...this.#pt_fetch_options };
        put_opt.method = "PUT";
        put_opt.body = JSON.stringify({ translation });

        const url = `${this.PARATRANZ_API_ENDPOINT}/projects/${this.PARATRANZ_PROJECT_ID}/strings/${string_id}`;
        return fetch(url, put_opt).then((res) => {
            if (!res.ok) {
                print("ParaTranz stopped responding, try again later");
                process.exit(7);
            }

            return res;
        });
    };
};

exports.ParaTranz = ParaTranz;
// Paratranz API