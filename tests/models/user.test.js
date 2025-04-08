import { expect } from 'chai';
const User = require('../../models/user');

describe('User Model', () => {
  it('should hash the password before saving', async () => {
    const user = new User({ email: 'test@charlotte.edu', password: 'password' });
    await user.save();
    expect(user.password).to.not.equal('password');
  });

  it('should validate email format', async () => {
    const user = new User({ email: 'invalid-email', password: 'password' });
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.email).to.exist;
    }
  });
});