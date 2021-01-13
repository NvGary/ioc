type Factory = (dependencies: Array<Object>) => any;

interface ICreationInfo {
  factory: Factory;
  dependencies: Array<string>;
};

class Container {
  private _registrations: Map<string, ICreationInfo>;

  constructor() {
    this._registrations = new Map();
  }

  // get a new instance of class
  //   name - tag associated with class registration. Previously used in corresponding 'register' request
  //
  // potential failures:
  // - unregistered class
  // - cyclic dependencies
  public get(name: string) {
    return this._get(name);
  }

  // register a new class
  //   name - tag associated with class registration. Used in a subsequent 'get' request
  //   factory - method to be used to instatiate this class. Dependencies will be passed as a parameter array.
  //   dependencies - array of dependency tags to be auto instantiated and passed to factor method
  //
  //  e.g.
  //    const factory = dependencies => new ClassA(dependencies);
  //    container.register('class_a', factory, ['class_b', 'class_c']);
  //
  // potential faillures:
  // - invalid name provided
  // - invalid factory provided
  // - invalid dependency name provided
  // - attempted to register duplicate class
  public register(name: string, factory: Factory, dependencies: Array<string> = []) {
    if (false === this._isValidName(name)) {
      throw new Error('invalid name provided');
    }
    if (false === this._isValidFactory(factory)) {
      throw new Error('invalid factory provided');
    }
    if (false === this._areValidDependencies(dependencies)) {
      throw new Error('invalid dependency name provided');
    }
    if (this._registrations.has(name)) {
      throw new Error('attempted to register duplicate class');
    }
    this._registrations.set(name, { factory, dependencies });
  }

  private _areValidDependencies(dependencies: Array<string>) {
    if (false === Array.isArray(dependencies)) throw new Error('dependencies must be an array of names');
    return dependencies.reduce((result, name) => result && this._isValidName(name), true);
  };

  private _isValidFactory(factory: Factory) {
    if (typeof factory !== 'function') return false;
    return true;
  };

  private _isValidName(name: string) {
    if (typeof name !== 'string') return false;
    if(name === '') return false;
    return true;
  };

  private _get(name: string, parents: Array<string> = []): Array<Object> {
    if (parents.includes(name)) throw new Error('cyclic dependencies');

    const registration: ICreationInfo | undefined = this._registrations.get(name);
    if (!registration) throw new Error('unregistered class')

    return registration.factory(this._mapDependencies(registration.dependencies, [...parents, name]));
  }

  private _mapDependencies(dependencies: Array<string>, parents: Array<string>) {
    return dependencies.map(name => this._get(name, parents));
  };
}

export { Container };
