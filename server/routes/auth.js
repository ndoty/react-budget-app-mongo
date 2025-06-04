// server/routes/auth.js (ensure this is correct)
const express = require('express');
const router = express.Router();
// ... (bcrypt, jwt, User model, dotenv requires) ...
console.log("SERVER: server/routes/auth.js - File loaded, router instance created.");


// Test GET route
router.get('/test-auth-route', (req, res) => {
    console.log("SERVER: GET /api/auth/test-auth-route (from file) hit!");
    res.status(200).json({ message: "Auth router test GET route (from file) is working!" });
});

// POST /register (as defined before)
router.post('/register', async (req, res) => {
  // ... your full registration logic from the previous "full files" response ...
  console.log(`SERVER: POST /api/auth/register (from file) hit with body:`, req.body ? JSON.stringify(req.body).substring(0, 100) + "..." : "undefined");
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("SERVER: Registration failed - missing fields.");
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  // ... (rest of the registration logic)
  // For brevity, I'm not pasting the whole thing again, but ensure it's the complete version.
  // Make sure it ends with sending a response.
  // For this test, you can even simplify it:
  // res.status(201).json({ message: "Register route hit (from file)", username });
  // But use the full version if you want to test DB interaction.
  // Ensure the full logic from the "full files" response for server/routes/auth.js is here.
  const { User } = require('../models/User'); // Example, path might vary
   try {
    let user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ username: username.toLowerCase(), password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { user: { id: user.id } };
    jwt.sign(payload,process.env.JWT_SECRET,{ expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error("Reg Error:", err.message);
    res.status(500).send("Server Reg Error");
  }
});


// POST /login (as defined before)
router.post('/login', async (req, res) => {
  // ... your full login logic ...
  // Ensure the full logic from the "full files" response for server/routes/auth.js is here.
    res.status(200).json({message: "Login route placeholder hit"});
});

module.exports = router;
