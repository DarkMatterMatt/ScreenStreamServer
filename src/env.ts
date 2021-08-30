import { bool, cleanEnv, makeValidator, port, str } from "envalid";

type NodeEnv = "development" | "production" | "test";

const nodeEnv = makeValidator(x => str({ choices: ["development", "test", "production"] })._parse(x) as NodeEnv);

const env = cleanEnv(process.env, {
    CERT_FILE_NAME: str({ default: "" }),
    KEY_FILE_NAME: str({ default: "" }),
    LOG_LEVEL: str({ default: "info", choices: ["error", "warn", "info", "verbose"] }),
    LOG_FILE_TEMPLATE: str({ default: "combined_%DATE%.log" }),
    NODE_ENV: nodeEnv({ default: "development" }),
    PORT: port({ default: 9001 }),
    USE_SSL: bool({ default: false }),
});

if (env.USE_SSL) {
    if (env.CERT_FILE_NAME === "") {
        throw new Error("env.CERT_FILE_NAME must be set when using SSL.");
    }
    if (env.KEY_FILE_NAME === "") {
        throw new Error("env.KEY_FILE_NAME must be set when using SSL.");
    }
}

export default env;
