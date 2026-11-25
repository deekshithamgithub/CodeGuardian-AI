function getUser(username) {
    return db.query(
        "SELECT * FROM users WHERE name = '" + username + "'"
    );
}