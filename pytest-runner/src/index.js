/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const {spawn} = require('child_process');
const chalk = require('chalk');
const throat = require('throat');

class TestRunner {
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
  }

  async runTests(tests, watcher, onStart, onResult, onFailure, options) {
    const mutex = throat(this._globalConfig.maxWorkers);
    return Promise.all(
      tests.map(test =>
        mutex(async () => {
          if (watcher.isInterrupted()) {
            throw new CancelRun();
          }

          await onStart(test);

          return this._runTest(
            test.path,
            test.context.config,
            test.context.resolver,
          )
            .then(result => onResult(test, result))
            .catch(error => onFailure(test, error));
        }),
      ),
    );
  }

  async _runTest(testPath, projectConfig, resolver) {
    return new Promise((resolve, reject) => {
      const child = spawn('py.test', ['--json=/dev/stderr', testPath]);
      let stderr = '';
      child.stderr.setEncoding('utf-8');
      child.stderr.on('data', data => (stderr += data));
      child.stderr.on('error', error => reject(error));
      child.stderr.on('close', () => {
        let result;
        try {
          result = JSON.parse(stderr);
        } catch (error) {
          reject(error);
        }
        const {summary, tests} = result.report;
        const end = +new Date();
        resolve({
          console: null,
          failureMessage: summary.failed ? formatFailureMessage(tests) : null,
          numFailingTests: summary.failed || 0,
          numPassingTests: summary.passed || 0,
          numPendingTests: 0,
          perfStats: {
            end: end,
            start: end - summary.duration,
          },
          skipped: false,
          snapshot: {
            added: 0,
            fileDeleted: false,
            matched: 0,
            unchecked: 0,
            unmatched: 0,
            updated: 0,
          },
          sourceMaps: {},
          testExecError: null,
          testFilePath: testPath,
          testResults: tests.map(toTest),
        });
      });
    });
  }
}

class CancelRun extends Error {
  constructor(message) {
    super(message);
    this.name = 'CancelRun';
  }
}

const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');

const formatFailureMessage = tests =>
  tests
    .filter(test => test.outcome === 'failed')
    .map(test => {
      const message = test.call.longrepr
        .split(/\n/)
        .map(line => MESSAGE_INDENT + line)
        .join('\n');

      const title =
        chalk.bold.red(TITLE_INDENT + TITLE_BULLET + test.name) + '\n';

      return title + '\n' + message;
    })
    .join('\n') + '\n';

const toTest = test => ({
  ancestorTitles: [],
  duration: test.duration,
  failureMessages: test.call.outcome === 'failed' ? [test.call.longrepr] : [],
  fullName: test.name,
  numPassingAsserts: test.outcome === 'passed' ? 1 : 0,
  status: test.outcome,
  title: test.name,
});

module.exports = TestRunner;
