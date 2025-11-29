import * as bcrypt from 'bcrypt';

async function generateHashes() {
  const password = 'Password123!';
  const saltRounds = 10;

  console.log('Generating bcrypt hashes for password: Password123!\n');

  for (let i = 1; i <= 4; i++) {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Hash ${i}: ${hash}`);
  }
}

generateHashes().catch(console.error);
