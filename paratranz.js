// Paratranz API
class ParaTranz {
    #pt_fetch_options;

    constructor(project_id, api_key, api_endpoint, readline) {
        this.PARATRANZ_PROJECT_ID = project_id;
        this.PARATRANZ_API_KEY = api_key;
        this.PARATRANZ_API_ENDPOINT = api_endpoint;
        this.Readline = readline;

        this.#pt_fetch_options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.PARATRANZ_API_KEY,
            },
        }
    };

    async testEndpoint() {
        try {
            const result = await this.getProjects();
            if (result) {
                return true;
            }
        } catch (error) {
            return false;
        }

        return false;
    }

    async queryParatranzAPI(path) {
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

    async selectProject() {
        const PROJECTS_PAGE_COUNT = (await this.getProjects(1)).pageSize;
        for (let i = 1; i <= PROJECTS_PAGE_COUNT; i++) {
            const p_list = await this.getProjects(i);

            if (i > PROJECTS_PAGE_COUNT) {
                return false;

            }

            if (this.PARATRANZ_PROJECT_ID === undefined) {
                print("\nSelect a project id from this list: \n");
                p_list.results.forEach(element => {
                    print(element.id + " " + element.name);
                });

                const result = await this.Readline.askPID(p_list.results.map((el) => el.id));

                if (result === false) {
                    continue;
                }

                this.PARATRANZ_PROJECT_ID = result;
            }
            else {
                const project = p_list.results.find((el) => el.id === Number.parseInt(this.PARATRANZ_PROJECT_ID));
                if (project !== undefined) {
                    print("Project selected: " + project.id + " " + project.name);
                    break;
                }
            }
        }

        return true;
    }

    getFiles() {
        return this.queryParatranzAPI(`/projects/${this.PARATRANZ_PROJECT_ID}/files`);
    }

    getStringsForPage(page, file_id) {
        // 1000 is the maximum item count per page
        const itemCount = 1000;
        let url = `/projects/${this.PARATRANZ_PROJECT_ID}/strings?stage=1&page=${page}&pageSize=${itemCount}`;

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

    async getStringsToTranslate(page = 1, file_id) {
        if (this.PARATRANZ_PROJECT_ID === undefined) {
            throw new Error("Project id must be defined !");
        }

        const untranslatedStrings = await this.getStringsForPage(page, file_id);
        return untranslatedStrings.results || [];
    };

    async putTranslation(string_id, translation) {
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