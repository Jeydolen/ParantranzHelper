const readline = require("node:readline/promises");

class Readline {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    };

    ask = (query) => this.rl.question(query);

    async validateTranslation() {
        const ans = await this.ask("Valid translation ? Y(es)/n(o)/r(ewrite)\n");

        switch (ans.toLowerCase()) {
            case "y": return 1;
            case "n": return 0;
            case "r": return -1;
            default: return this.validateTranslation();
        }
    };

    async rewriteTranslation(originalTranslation) {
        this.rl.write(originalTranslation);

        return this.rl.question("> ");
    };

    async askPID(project_ids) {
        const answer = await this.ask("Press N(ext) or select project id: ");
        if (answer.toLowerCase() === "n") {
            return false;
        }

        const answerInt = Number.parseInt(answer);

        if (!Number.isNaN(answerInt) && project_ids.includes(answerInt)) {
            return answer;
        } else {
            console.error("This is not a number from the list");
            return this.askPID(project_ids);
        }
    };
};

exports.Readline = Readline;