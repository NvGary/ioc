;
class Container {
    constructor() {
        this._registrations = new Map();
    }
    // get a new instance of class
    //   name - tag associated with class registration. Previously used in corresponding 'register' request
    //
    // potential failures:
    // - unregistered class
    // - cyclic dependencies
    get(name) {
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
    register(name, factory, dependencies = []) {
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
    _areValidDependencies(dependencies) {
        if (false === Array.isArray(dependencies))
            throw new Error('dependencies must be an array of names');
        return dependencies.reduce((result, name) => result && this._isValidName(name), true);
    }
    ;
    _isValidFactory(factory) {
        if (typeof factory !== 'function')
            return false;
        return true;
    }
    ;
    _isValidName(name) {
        if (typeof name !== 'string')
            return false;
        if (name === '')
            return false;
        return true;
    }
    ;
    _get(name, parents = []) {
        if (parents.includes(name))
            throw new Error('cyclic dependencies');
        const registration = this._registrations.get(name);
        if (!registration)
            throw new Error('unregistered class');
        return registration.factory(this._mapDependencies(registration.dependencies, [...parents, name]));
    }
    _mapDependencies(dependencies, parents) {
        return dependencies.map(name => this._get(name, parents));
    }
    ;
}
export { Container };
