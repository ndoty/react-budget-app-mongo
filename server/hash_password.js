const bcrypt = require('bcryptjs');
const readline = require('readline');

// This script securely generates a new bcrypt hash for a given password.

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("--- Password Hash Generator ---");
rl.question('Enter the password to hash: ', (password) => {
  if (!password) {
    console.error("Error: Password cannot be empty.");
    rl.close();
    return;
  }

  // Generate a salt and hash the password
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      rl.close();
      return;
    }
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        rl.close();
        return;
      }
      console.log("\n✅ New Bcrypt Hash Generated Successfully!");
      console.log("-----------------------------------------");
      console.log("Copy this entire hash below and use it to update the 'password' field in your MongoDB document:");
      console.log(hash);
      console.log("-----------------------------------------");
      rl.close();
    });
  });
});
