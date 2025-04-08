import sinon from 'sinon';
import { expect } from 'chai';
const listingsController = require('../../controllers/listingsController.js');
const Listing = require('../../models/listing.js');

describe('listingsController', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should fetch all active listings', async () => {
    const req = { query: {} };
    const res = { render: sinon.spy() };
    const next = sinon.spy();

    const mockListings = [{ name: 'Item 1', price: 10 }, { name: 'Item 2', price: 20 }];
    sinon.stub(Listing, 'find').returns({
      sort: sinon.stub().returns(Promise.resolve(mockListings)),
    });

    await listingsController.getAllListings(req, res, next);

    expect(res.render.calledWith('./listings/browse', { listings: mockListings })).to.be.true;
  });

  it('should handle errors when fetching listings', async () => {
    const req = { query: {} };
    const res = { render: sinon.spy() };
    const next = sinon.spy();

    sinon.stub(Listing, 'find').throws(new Error('Database error'));

    await listingsController.getAllListings(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0].message).to.equal('Database error');
  });
});