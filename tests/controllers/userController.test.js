const sinon = require('sinon');
import { expect } from 'chai';
const User = require('../../models/user.js');
const userController = require('../../controllers/userController.js');

describe('userController', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should register a new user', async () => {
    const req = {
      body: { email: 'test@charlotte.edu', password: 'password', repassword: 'password' },
      flash: sinon.spy(),
    };
    const res = { redirect: sinon.spy() };
    const next = sinon.spy();

    sinon.stub(User, 'findOne').resolves(null);
    sinon.stub(User.prototype, 'save').resolves();

    await userController.create(req, res, next);

    expect(req.flash.calledWith('success_msg', 'User registered successfully')).to.be.true;
    expect(res.redirect.calledWith('/user/login')).to.be.true;
  });

  it('should handle duplicate email registration', async () => {
    const req = {
      body: { email: 'test@charlotte.edu', password: 'password', repassword: 'password' },
      flash: sinon.spy(),
    };
    const res = { redirect: sinon.spy() };
    const next = sinon.spy();

    sinon.stub(User, 'findOne').resolves({ email: 'test@charlotte.edu' });

    await userController.create(req, res, next);

    expect(req.flash.calledWith('error_msg', 'Email already in use')).to.be.true;
    expect(res.redirect.calledWith('/user/register')).to.be.true;
  });
});