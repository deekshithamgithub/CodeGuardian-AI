function vulnerableQuery(db, userId) {
    db.query(`SELECT * FROM users WHERE id = ${userId}`);
}

function safeQuery(db, userId) {
    db.query("SELECT * FROM users WHERE id = ?", [userId]);
}