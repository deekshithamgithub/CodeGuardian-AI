const fs = require("fs");
const path = require("path");

function safeFileAccess() {
    const baseDir = path.resolve("uploads");
    const filePath = path.resolve(baseDir, "example.txt");

    if (!filePath.startsWith(baseDir + path.sep)) {
        throw new Error("Invalid file path");
    }

    return fs.readFileSync(filePath, "utf8");
}