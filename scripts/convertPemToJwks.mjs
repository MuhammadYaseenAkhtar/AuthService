import fs from "fs";
import path from "path";
import rsaPemToJwk from "rsa-pem-to-jwk";

const privateKey = fs.readFileSync(
    // eslint-disable-next-line no-undef
    path.resolve(process.cwd(), "certs/private.pem"),
    "utf8",
);

const privateKeyJwk = rsaPemToJwk(privateKey, { use: "sig" }, "public");

// eslint-disable-next-line no-undef
console.log("privateKeyJwk", JSON.stringify(privateKeyJwk));
