/**
 * Offline tests for storybook-addon-ai-chatbot.
 *
 * These check the option handling, the managerHead hook and the loader it puts
 * on the manager page. No Storybook install is needed. Real Storybook builds
 * are described in SUBMISSION.md.
 *
 * Run: node plugins/storybook/tests/test_preset.js
 */

'use strict';

var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var path = require('path');
var preset = require('../preset.js');

var passed = [];
var failed = [];

function check(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log('  PASS  ' + name);
  } catch (err) {
    failed.push(name);
    console.log('  FAIL  ' + name + '  -> ' + err.message);
  }
}

var ID = 'asyntai_1a2b3c4d5e6f';

/** Runs the loader in a fake browser and returns the scripts it appended. */
function runLoader(code, state) {
  var readyState = (state && state.readyState) || 'complete';
  var existing = !!(state && state.existing);
  var appended = [];
  var loadHandler = null;
  var document = {
    readyState: readyState,
    querySelector: function (sel) {
      return existing && sel === 'script[data-asyntai-id]' ? {} : null;
    },
    createElement: function () {
      var attrs = {};
      return {
        attrs: attrs,
        setAttribute: function (k, v) {
          attrs[k] = v;
        },
      };
    },
    head: {
      appendChild: function (el) {
        appended.push(el);
      },
    },
  };
  var window = {
    addEventListener: function (ev, fn) {
      if (ev === 'load') loadHandler = fn;
    },
  };
  vm.runInNewContext(code, { document: document, window: window });
  return {
    appended: appended,
    fireLoad: function () {
      if (loadHandler) loadHandler();
    },
  };
}

console.log('validateOptions');

check('valid ID is accepted and trimmed', function () {
  var s = preset.validateOptions({ widgetId: '  ' + ID + ' ' });
  assert.strictEqual(s.widgetId, ID);
  assert.strictEqual(s.scriptUrl, preset.DEFAULT_SCRIPT_URL);
});

check('missing options throw with the fix', function () {
  assert.throws(function () {
    preset.validateOptions(undefined);
  }, /"widgetId" is required.*\.storybook\/main/);
});

check('empty ID throws', function () {
  assert.throws(function () {
    preset.validateOptions({ widgetId: '   ' });
  }, /required/);
});

check('non-string ID throws', function () {
  assert.throws(function () {
    preset.validateOptions({ widgetId: 12345 });
  }, /required/);
});

check('malformed ID throws and names the value', function () {
  assert.throws(function () {
    preset.validateOptions({ widgetId: 'abc123' });
  }, /"abc123" does not look like a widget ID/);
});

check('ID with HTML is rejected', function () {
  assert.throws(function () {
    preset.validateOptions({ widgetId: 'asyntai_x"><script>' });
  }, /does not look like a widget ID/);
});

check('custom script URL is used', function () {
  var s = preset.validateOptions({ widgetId: ID, scriptUrl: ' https://example.com/w.js ' });
  assert.strictEqual(s.scriptUrl, 'https://example.com/w.js');
});

check('blank script URL falls back to the CDN', function () {
  var s = preset.validateOptions({ widgetId: ID, scriptUrl: '  ' });
  assert.strictEqual(s.scriptUrl, preset.DEFAULT_SCRIPT_URL);
});

check('default script URL is the Asyntai CDN', function () {
  assert.strictEqual(preset.DEFAULT_SCRIPT_URL, 'https://widget.asyntai.com/static/js/chat-widget.js');
});

console.log('managerHead');

check('appends one loader to the existing head', function () {
  var out = preset.managerHead('<meta name="x">', { widgetId: ID });
  assert.ok(out.indexOf('<meta name="x">') === 0);
  assert.strictEqual(out.split('data-asyntai-loader').length - 1, 1);
});

check('works when head is undefined', function () {
  var out = preset.managerHead(undefined, { widgetId: ID });
  assert.ok(out.indexOf('<script data-asyntai-loader>') !== -1);
});

check('does not add a second loader', function () {
  var once = preset.managerHead('', { widgetId: ID });
  var twice = preset.managerHead(once, { widgetId: ID });
  assert.strictEqual(twice, once);
});

check('ignores Storybook options it does not know', function () {
  var out = preset.managerHead('', { widgetId: ID, configDir: '.storybook', configType: 'PRODUCTION' });
  assert.ok(out.indexOf(ID) !== -1);
});

check('throws without a widget ID', function () {
  assert.throws(function () {
    preset.managerHead('', { configDir: '.storybook' });
  }, /"widgetId" is required/);
});

console.log('loader');

check('tag is a single inline script', function () {
  var tag = preset.buildTag(ID, preset.DEFAULT_SCRIPT_URL);
  assert.ok(/^<script data-asyntai-loader>[\s\S]*<\/script>$/.test(tag));
  assert.strictEqual(tag.split('</script>').length - 1, 1);
});

check('loader is valid JavaScript', function () {
  new vm.Script(preset.buildLoader(ID, preset.DEFAULT_SCRIPT_URL));
});

check('page already loaded: script is added at once', function () {
  var r = runLoader(preset.buildLoader(ID, preset.DEFAULT_SCRIPT_URL));
  assert.strictEqual(r.appended.length, 1);
  assert.strictEqual(r.appended[0].src, preset.DEFAULT_SCRIPT_URL);
  assert.strictEqual(r.appended[0].async, true);
  assert.strictEqual(r.appended[0].attrs['data-asyntai-id'], ID);
});

check('page still loading: script waits for the load event', function () {
  var r = runLoader(preset.buildLoader(ID, preset.DEFAULT_SCRIPT_URL), { readyState: 'loading' });
  assert.strictEqual(r.appended.length, 0);
  r.fireLoad();
  assert.strictEqual(r.appended.length, 1);
});

check('page with a widget already: nothing is added', function () {
  var r = runLoader(preset.buildLoader(ID, preset.DEFAULT_SCRIPT_URL), { existing: true });
  assert.strictEqual(r.appended.length, 0);
});

check('"<" in the script URL cannot close the script element', function () {
  var tag = preset.buildTag(ID, 'https://example.com/</script><b>x');
  assert.strictEqual(tag.split('</script>').length - 1, 1);
  var r = runLoader(preset.buildLoader(ID, 'https://example.com/</script><b>x'));
  assert.strictEqual(r.appended[0].src, 'https://example.com/</script><b>x');
});

console.log('package');

var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

check('first keyword is storybook-addon', function () {
  assert.strictEqual(pkg.keywords[0], 'storybook-addon');
});

check('catalog metadata is set', function () {
  assert.strictEqual(pkg.storybook.displayName, 'Asyntai AI Chatbot');
  assert.ok(/^https:\/\/.+\.png$/.test(pkg.storybook.icon));
  assert.ok(pkg.storybook.supportedFrameworks.length > 0);
});

check('preset.js is at the package root and shipped', function () {
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'preset.js')));
  assert.ok(pkg.files.indexOf('preset.js') !== -1);
  assert.strictEqual(pkg.exports['./preset'].default, './preset.js');
});

check('homepage is the asyntai.com docs page', function () {
  assert.strictEqual(pkg.homepage, 'https://asyntai.com/documentation/integrations/storybook/');
});

check('README is shipped', function () {
  assert.ok(pkg.files.indexOf('README.md') !== -1);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'README.md')));
});

console.log('\n' + passed.length + ' passed, ' + failed.length + ' failed');
process.exit(failed.length ? 1 : 0);
