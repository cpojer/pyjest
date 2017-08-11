# pyjest

An experimental example test runner for Jest that runs Python tests within Jest.

![expo runner](/jest-21-expo-runner.gif?raw=true)

## Install

Requires python and node.js 8+.

```
cd example
pip install -r requirements.txt
yarn
```

## Run

```
yarn test
```

## Runner API

Check out `pytest-runner/src/index.js` for a minimal implementation of a
test runner for Jest. This API is experimental.

Jest Pull Requests that enabled this feature:

* [Rename TestRunner to TestScheduler](https://github.com/facebook/jest/pull/4218)
* [Split TestRunner off of TestScheduler](https://github.com/facebook/jest/pull/4233)
* [Make jest-runner a standalone package](https://github.com/facebook/jest/pull/4236)
* [Make Jest's Test Runner configurable](https://github.com/facebook/jest/pull/4240)
