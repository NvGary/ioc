import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { Container } from '../dist/container.js';

const { expect } = chai;
chai.use(sinonChai);

describe('Container class tests', () => {
  it('can be constructed', () => {
    expect(new Container()).to.be.instanceOf(Container);
  })

  describe('functionality tests', () => {
    const FACTORY_NO_OP = () => ({}); // simplest valid factory method
    let container = null;
    beforeEach(() => {
      // object under test
      container = new Container();
    });
    afterEach(() => {
      container = null;
    });

    describe('register function', () => {
      it('allows a class to be registered', () => {
        expect(() => container.register('example', FACTORY_NO_OP)).to.not.throw();
      });

      it('disallows duplicate class registration', () => {
        expect(() => container.register('example', FACTORY_NO_OP)).to.not.throw();
        expect(() => container.register('example', FACTORY_NO_OP)).to.throw(Error, 'attempted to register duplicate class');
      });

      describe('param checking', () => {
        ['', null, undefined, NaN, new Object(), () => 'this is a function'].forEach(invalidName => 
          it(`requires name to be a non-empty string - testing ${JSON.stringify({ name: invalidName, type: typeof invalidName })}`, () => {
            expect(() => container.register(invalidName, FACTORY_NO_OP)).to.throw(Error, 'invalid name provided')
          })
        );
        ['', null, undefined, NaN, new Object()].forEach(invalidFactory => 
          it(`requires factory to be a function  - testing ${JSON.stringify({ factory: invalidFactory, type: typeof invalidFactory })}`, () => {
            expect(() => container.register('example', invalidFactory)).to.throw(Error, 'invalid factory provided')
          })
        );
        ['', null, NaN, new Object(), () => 'this is a function'].forEach(invalidDependencyName => 
          it(`requires dependencies to be an array - testing ${JSON.stringify({ name: invalidDependencyName, type: typeof invalidDependencyName })}`, () => {
            expect(() => container.register('example', FACTORY_NO_OP, invalidDependencyName)).to.throw(Error, 'dependencies must be an array of names')
          })
        );
        [[''], [null], [undefined], [NaN], [new Object()], [() => 'this is a function'], ['valid dependency', () => 'this is a function']].forEach(invalidDependencies => 
          it(`requires dependency names to be a non-empty string - testing ${JSON.stringify({ name: invalidDependencies, value: JSON.stringify(invalidDependencies) })}`, () => {
            expect(() => container.register('example', FACTORY_NO_OP, invalidDependencies)).to.throw(Error, 'invalid dependency name provided')
          })
        );
      });
    });

    describe('get function', () => {
      describe('without dependencies', () => {
        beforeEach(() => {
          container.register('example', FACTORY_NO_OP);
        });
  
        it('allows a class instance to be created and retrieved', () => {
          expect(container.get('example')).to.deep.equal({});
        });

        it('throws an error where class is not registered', () => {
          expect(() => container.get('unregistered')).to.throw(Error, 'unregistered class');
        });
      });

      describe('with dependencies', () => {
        const spies = {};
        const FACTORY_DEPENDENCY = name => () => name;
        const FACTORY_EXAMPLE = () => 'ex';
        beforeEach(() => {
          spies.get = sinon.spy(container, '_get');
          spies.factory = sinon.fake(FACTORY_EXAMPLE);
        });
  
        describe('simple chain', () => {
          beforeEach(() => {
            container.register('example', spies.factory, ['dependency_a', 'dependency_b']);
            container.register('dependency_a', FACTORY_DEPENDENCY('dep_a'));
            container.register('dependency_b', FACTORY_DEPENDENCY('dep_b'), ['dependency_c']);
            container.register('dependency_c', FACTORY_DEPENDENCY('dep_c'));
          });

          it('allows a class instance to be created and retrieved', () => {
            expect(container.get('example')).to.deep.equal('ex');
          });
    
          it('invokes get on all dependencies', () => {
            container.get('example');
            expect(spies.get.callCount).to.equal(4);
            expect(spies.get.firstCall).to.be.calledWithExactly('example');
            expect(spies.get.secondCall).to.be.calledWithExactly('dependency_a', ['example']);
            expect(spies.get.thirdCall).to.be.calledWithExactly('dependency_b', ['example']);
            expect(spies.get.lastCall).to.be.calledWithExactly('dependency_c', ['example', 'dependency_b']);
          });
    
          it('invokes example constructor with dependencies', () => {
            container.get('example');
            expect(spies.factory.callCount).to.equal(1);
            expect(spies.factory).to.be.calledWithExactly(['dep_a', 'dep_b']);
          });
        });

        describe('complex chain', () => {
          beforeEach(() => {
            container.register('example', spies.factory, ['dependency_d', 'dependency_c', 'dependency_b', 'dependency_a']);
            container.register('dependency_a', FACTORY_DEPENDENCY('dep_a'), ['dependency_b', 'dependency_e']);
            container.register('dependency_b', FACTORY_DEPENDENCY('dep_b'), ['dependency_c', 'dependency_e']);
            container.register('dependency_c', FACTORY_DEPENDENCY('dep_c'), ['dependency_d', 'dependency_e']);
            container.register('dependency_d', FACTORY_DEPENDENCY('dep_d'), ['dependency_e']);
            container.register('dependency_e', FACTORY_DEPENDENCY('dep_e'));
          });

          it('allows a class instance to be created and retrieved', () => {
            expect(container.get('example')).to.deep.equal('ex');
          });
    
          it('invokes get on all dependencies', () => {
            container.get('example');
            expect(spies.get.callCount).to.equal(21);
            expect(spies.get.firstCall).to.be.calledWithExactly('example');
            expect(spies.get.secondCall).to.be.calledWithExactly('dependency_d', ['example']);
            expect(spies.get.thirdCall).to.be.calledWithExactly('dependency_e', ['example', 'dependency_d']);
            expect(spies.get.lastCall).to.be.calledWithExactly('dependency_e', ['example', 'dependency_a']);
          });
    
          it('invokes example constructor with dependencies', () => {
            container.get('example');
            expect(spies.factory.callCount).to.equal(1);
            expect(spies.factory).to.be.calledWithExactly(['dep_d', 'dep_c', 'dep_b', 'dep_a']);
          });
        });

        describe('cyclic chain', () => {
          beforeEach(() => {
            container.register('example', spies.factory, ['dependency_a', 'dependency_b']);
            container.register('dependency_a', FACTORY_DEPENDENCY('dep_a'), ['dependency_b']);
            container.register('dependency_b', FACTORY_DEPENDENCY('dep_b'), ['dependency_a']);
          });

          it('prevents a class instance from being created and retrieved', () => {
            expect(() => container.get('example')).to.throw(Error, 'cyclic dependencies');
          });

          it('does not call factory method', () => {
            try {
              container.get('example');
            }
            catch {
              expect(spies.factory.called).to.equal(false);
            }
          });
        });
      });
    });
  });
});
