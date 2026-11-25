
// 1. Hardcoded secret
const password = "admin12345";

// 2. Dangerous eval
function vulnerableEval(input) {
    eval(input);
}

// 3. Unsafe innerHTML
function vulnerableHTML(element, input) {
    element.innerHTML = input;
}

// 4. JavaScript SQL injection
function vulnerableSQL(db, userId) {
    db.query(`SELECT * FROM users WHERE id = ${userId}`);
}

// 5. JavaScript path traversal
function vulnerableFile(req, fs) {
    const filename = req.query.file;
    return fs.readFileSync(filename, "utf8");
}

// 6. GitHub token format
const githubValue = "ghp_abcdefghijklmnopqrstuvwxyz123456";

// 7. Google API key format
const googleValue = "AIzaSyAbcdefghijklmnopqrstuvwxyz123456";
