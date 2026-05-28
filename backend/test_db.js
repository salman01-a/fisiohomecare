const { Therapist, User } = require('./src/models');

async function test() {
  const therapists = await Therapist.findAll({ include: [{ model: User, as: 'user' }], raw: true, nest: true });
  console.log(JSON.stringify(therapists, null, 2));
  process.exit();
}

test();
