import chai from "chai";
import * as API from '../dist/index.js';

const { expect } = chai;

describe('API tests', () => {
  it('exposes only 1 interface', () => {
    expect(Object.entries(API)).to.have.lengthOf(1);
  });

  it('exposes Container as a constructor', () => {
    expect(API).to.respondTo('Container');
  });
});
