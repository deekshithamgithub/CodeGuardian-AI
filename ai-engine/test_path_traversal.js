const fs = require("fs");

function vulnerable(req) {
    const filename = req.query.file;
    return fs.readFileSync(filename, "utf8");
}

function safe() {
    return fs.readFileSync("uploads/example.txt", "utf8");
}