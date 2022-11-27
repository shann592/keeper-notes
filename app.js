// modules import
require('dotenv').config(); // dotenv module setup
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const format = require('date-fns/format');
const session = require('express-session');
// passport js modules
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// initializing express app
const app = express();

// basic project setup
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
// below code will tell express to use session
app.use(session({
    // secret will be used to encrypt and decrypt cookies
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));

// initializing passport
app.use(passport.initialize());
// setting passport as middleware
app.use(passport.session());

// Passport to use local startegy


// connecting to mongoDB

mongoose.connect(process.env.CONNECTION_URL)
    .then(() => console.log("Connected to database"))
    .catch(error => console.log("Error connecting to database: " + error));

// Notes schema
const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: String,
    username: String,
});

const userSchema = new mongoose.mongoose.Schema({
    username: String,
    password: String,
});
// adding plugin to user schema
userSchema.plugin(passportLocalMongoose);

// notes model
const Note = mongoose.model('Note', notesSchema);

// user model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app routes
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user.username)
        res.redirect('/notes');
    } else {
        res.redirect('/loginOrRegister');
    }
});

app.post('/logout', (req, res) => {
    req.logout((error) => {
        if (!error) {
            res.redirect('/');
        } else {
            console.log('error encountered during logout: ' + error)
        }
    });
})

app.route('/loginOrRegister')
    .get((req, res) => {
        res.render('loginOrRegister');
    })
    .post((req, res) => {
        const formType = req.body.formType;
        if (formType === 'register') {
            User.register({ username: req.body.username }, req.body.password, (err, user) => {
                if (err) {
                    console.log('Error encountered during registeration: ' + err);
                    res.redirect('/loginOrRegister');
                } else {
                    passport.authenticate('local')(req, res, () => {
                        res.redirect('notes');
                    })
                }
            })
        } else {
            const user = new User({
                username: req.body.username,
                password: req.body.password,
            });
            req.login(user, (err) => {
                if (err) {
                    console.log('Error while login: ' + err);
                } else {
                    passport.authenticate('local')(req, res, () => {
                        res.redirect('notes');
                    });
                }
            })
        }

    });

app.route('/notes')
    .get(async (req, res) => {
        try {
            if (req.isAuthenticated()) {
                const items = await Note.find({ username: req.user.username });
                res.render('notes', { notes: items });
            } else {
                res.redirect('/loginOrRegister');
            }
        } catch (error) {
            console.log(error);
        }
    })
    .post((req, res) => {

        const title = req.body.title;
        const content = req.body.content;
        const today = new Date();
        const date = format(today, 'MMM dd, yyyy');
        const note = new Note({
            title,
            content,
            date,
            username: req.user.username,
        });
        note.save().
            then(() => console.log('new note added'))
            .catch(error => console.log('Error encountered while saving new note: ' + error));
        res.redirect('/notes');
    });

app.post('/delete', (req, res) => {
    const noteToDelete = req.body.noteId;
    Note.deleteOne({ _id: noteToDelete })
        .then(() => console.log('Note deleted'))
        .catch(error => console.log('Error encountered while deleting a note: ' + error));
    res.redirect('/notes');
});

app.post('/update', (req, res) => {
    const editedTitle = req.body.title;
    const editedContent = req.body.content;
    const idToEdit = req.body.idToEdit;
    Note.updateOne({ _id: idToEdit }, {
        title: editedTitle,
        content: editedContent,
    })
        .then(() => {
            console.log('Note updated')
            res.redirect('/notes');
        })
        .catch(error => console.log(error));
})

// server running on port 3000
app.listen(3000, () => console.log('Server is running on port 3000'));