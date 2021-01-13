# Minimal IoC Container

## Description
Allows registration of classes together with dependency listing. Subsequent creation of this class can be performed and all dependencies will be automatically instantiated and provided as params to the class factory.

## Usage
```
import { Container } from 'ioc';

const container = new Container();
container.register('dependency_a', () => new DependencyA());
container.register('dependency_b', () => new DependencyB());
container.register('class_a', dependencies => new ClassA(dependencies), ['dependency_a', 'dependency_b']);

const classA = container.get('class_a');
```
