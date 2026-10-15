/**
 * Asyntai AI chatbot for Storybook.
 *
 * Adds the Asyntai chat widget to the Storybook manager: the outer page with
 * the sidebar, the toolbar and the Docs tab. The widget never goes into the
 * preview iframe, so stories and components render exactly as before.
 *
 * Storybook calls managerHead(head, options) and puts the returned HTML in the
 * <head> of the manager page, for `storybook dev` and `storybook build`.
 * Addon options from .storybook/main.* arrive merged into `options`.
 *
 * Plain CommonJS on purpose: Storybook 8 and 9 require() presets, and
 * Storybook 10 import()s them. Both read these exports.
 */

'use strict';

var DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';
var WIDGET_ID_PATTERN = /^asyntai_[A-Za-z0-9]+$/;
var NAME = 'storybook-addon-ai-chatbot';

/**
 * Checks the addon options. A wrong value throws with a message that says how
 * to fix it, which stops `storybook dev` and `storybook build`.
 */
function validateOptions(options) {
  var opts = options || {};
  var widgetId = typeof opts.widgetId === 'string' ? opts.widgetId.trim() : '';

  if (!widgetId) {
    throw new Error(
      NAME +
        ': "widgetId" is required. Add it to the addon entry in .storybook/main, ' +
        'for example { name: "' +
        NAME +
        '", options: { widgetId: "asyntai_1a2b3c4d5e6f" } }. Copy the ID from ' +
        'the Install page of your Asyntai dashboard.'
    );
  }
  if (!WIDGET_ID_PATTERN.test(widgetId)) {
    throw new Error(
      NAME +
        ': "' +
        widgetId +
        '" does not look like a widget ID. It starts with asyntai_, for ' +
        'example asyntai_1a2b3c4d5e6f.'
    );
  }

  var scriptUrl =
    typeof opts.scriptUrl === 'string' && opts.scriptUrl.trim()
      ? opts.scriptUrl.trim()
      : DEFAULT_SCRIPT_URL;

  return { widgetId: widgetId, scriptUrl: scriptUrl };
}

/** JSON.stringify, safe inside an HTML <script> element. */
function jsString(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * The loader waits for the page's load event before it fetches the widget, so
 * Storybook always renders first. It also skips the fetch when the page
 * already has a widget.
 */
function buildLoader(widgetId, scriptUrl) {
  return (
    '(function(){var l=function(){' +
    'if(document.querySelector("script[data-asyntai-id]"))return;' +
    'var s=document.createElement("script");' +
    's.src=' +
    jsString(scriptUrl) +
    ';s.async=true;' +
    's.setAttribute("data-asyntai-id",' +
    jsString(widgetId) +
    ');' +
    'document.head.appendChild(s)};' +
    'if(document.readyState==="complete"){l()}' +
    'else{window.addEventListener("load",l)}})();'
  );
}

function buildTag(widgetId, scriptUrl) {
  return '<script data-asyntai-loader>' + buildLoader(widgetId, scriptUrl) + '</script>';
}

/** Storybook preset hook: HTML for the <head> of the manager page. */
function managerHead(head, options) {
  var settings = validateOptions(options);
  var current = typeof head === 'string' ? head : '';
  if (current.indexOf('data-asyntai-loader') !== -1) {
    return current;
  }
  return current + '\n' + buildTag(settings.widgetId, settings.scriptUrl);
}

module.exports = {
  managerHead: managerHead,
  validateOptions: validateOptions,
  buildLoader: buildLoader,
  buildTag: buildTag,
  DEFAULT_SCRIPT_URL: DEFAULT_SCRIPT_URL,
};
