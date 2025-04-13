import { expect } from 'chai';
const Listing = require('../../models/listing');

describe('Listing Model', () => {
  it('should throw validation error if required fields are missing', async () => {
    const listing = new Listing({});
    try {
      await listing.validate();
    } catch (err) {
      expect(err.errors.name).to.exist;
      expect(err.errors.price).to.exist;
    }
  });

  it('should save a valid listing', async () => {
    const listing = new Listing({
      name: 'Test Item',
      condition: 'New',
      price: 10.99,
      description: 'A test item description',
      image: 'test.jpg',
    });

    const savedListing = await listing.save();
    expect(savedListing._id).to.exist;
    expect(savedListing.name).to.equal('Test Item');
  });
});