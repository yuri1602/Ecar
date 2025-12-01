const bcrypt = require('bcrypt');

const password = 'Password123!';
const hash = '$2b$10$lWXgeP8dgXMePtK3noP6T.iKeb3acsLPUst.oft0toWMAj9A/wJXK';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password match:', result);
    console.log('Testing password:', password);
    console.log('Against hash:', hash);
  }
});
