// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as path from 'path';

import {loadTests, TestConfig} from '../conductor/test_config.js';

module.exports = {
  require : [path.join(path.dirname(__dirname), 'conductor', 'mocha_hooks.js'), 'source-map-support/register'],
  spec : loadTests(__dirname),
  timeout : TestConfig.debug ? 0 : 10_000,
  retries : 4,
  reporter : path.join(path.dirname(__dirname), 'shared', 'mocha-resultsdb-reporter'),
  suiteName : 'e2e',
  slow : 1000, ...TestConfig.mochaGrep,
};
