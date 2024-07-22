const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { sendOtp } = require('./apps/emailmanager');
const { error } = require('console');

const { addUser, accessUser, checkEmailExists } = require('./apps/mongo.js');
const { runInNewContext } = require('vm');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render('index', { error: "" });
});
app.get('/signup', (req, res) => {
  res.render('signup', { error: "" });
});


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/signup', async (req, res) => {
  const email = (req.body["signup-email"] || '').trim().toLowerCase();
  const password1 = req.body["signup-password"] || '';
  const password2 = req.body["signup-confirm-password"] || '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  console.log("this is emails", email, password1, password2);

  if (!email || !emailRegex.test(email)) {
    return res.render('signup', { error: 'Invalid email format' });
  }

  console.log("this is email", email);

  try {
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return res.render('signup', { error: 'Email already in use' });
    }

    if (!password1 || !password1) {
      return res.render('signup', { error: 'Please provide a password' });
    }

    if (password1 !== password2) {
      return res.render('signup', { error: 'Passwords do not match' });
    }

    req.session.userEmail = email;

    const otp = generateOtp();
    req.session.user_otp = otp;
    req.session.user_pwd = password1;

    sendOtp(req.session.userEmail, req.session.user_otp);
    return res.render('verifyotp', { email: req.session.userEmail, error: "" });

  } catch (error) {
    console.error('Error checking email existence:', error);
    return res.render('signup', { error: 'An error occurred. Please try again.' });
  }
});



app.post("/verify-otp", (req, res) => {
  const inputOtp = req.body.otp;
  console.log("This is OTP:", inputOtp);

  if (inputOtp) {
    if (inputOtp.trim() === req.session.user_otp) {                                   // STORING PLAIN TEXT TEMPERORILY
      const newUser = { email: req.session.userEmail, password: req.session.user_pwd, password_txtform: req.session.user_pwd };
      addUser(newUser).catch(console.dir);

      req.session.loggedin = true
      req.session.useremail = req.session.userEmail

      delete req.session.userEmail
      delete req.session.user_pwd
      delete req.session.user_otp


      res.redirect("/dashboard")

    } else {

      return res.render('verifyotp', { email: req.session.userEmail, error: "The OTP you entered is incorrect" });
    }
  } else {
    return res.render('verifyotp', { email: req.session.userEmail, error: "Please provide the OTP" });
  }
});


app.get('/login', (req, res) => {
  res.render('login', { error: "" });
});



app.get("/dashboard/", (req, res) => {
  if (req.session.loggedin) {
    res.send("dashboard of " + req.session.useremail)
  }

  else {
    res.redirect("/")
  }
})



// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
