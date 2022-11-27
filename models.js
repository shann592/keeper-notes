const mongoose = require('mongoose');

// Notes schema
const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: String,
    username: String,
});

// notes model
const Note = mongoose.model('Note', notesSchema);

// user schema
const userSchema = new mongoose.mongoose.Schema({
    username: String,
    password: String,
});

// user model
const User = mongoose.model('User', userSchema);

export { notesSchema, userSchema, Note, User, };