/* globals require */

import Ember from 'ember';

const { RSVP: {all, Promise}, run } = Ember;

function reloadScript (scriptPath) {
  var tags = document.getElementsByTagName('script');
  for (var i = tags.length; i >= 0; i--){
    if (tags[i] && tags[i].getAttribute('src') != null && tags[i].getAttribute('src').indexOf(scriptPath) !== -1) {
      tags[i].parentNode.removeChild(tags[i]);
    }
  }
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.onload = () => run.later(() => resolve, 10);
    script.onerror = () => run.later(() => reject, 10);
    script.type = 'text/javascript';
    script.src = scriptPath;
    document.body.appendChild(script);
  });
}

function createPlugin (appName, hotReloadService) {

  function Plugin (window, host) {
    this.window = window;
    this.host = host;
  }
  Plugin.identifier = 'ember-hot-reload';
  Plugin.version = '1.0'; // Just following the example, this might not be even used
  Plugin.prototype.reload = function(path) {
    const cancelableEvent = { modulePath: path, cancel: false};
    hotReloadService.trigger('willLiveReload', cancelableEvent);
    if (cancelableEvent.cancel) {   // Only hotreload if someone canceled the regular reload
      // Reloading app.js will fire Application.create unless we set this.
      // TODO: make sure this doesn't break tests
      window.runningTests = true;
      all([reloadScript(`/assets/${appName}.js`), reloadScript('/assets/vendor.js')]).then(()=>{
        window.runningTests = false;
        hotReloadService.trigger('willHotReload', path);
      });

      return true;
    }
    return false;
  };
  Plugin.prototype.analyze = function() {
    return {
      disable: false
    };
  };

  return Plugin;
}

function lookup (appInstance, fullName) {
  if (appInstance.lookup) {
    return appInstance.lookup(fullName);
  }
  return appInstance.application.__container__.lookup(fullName);
}

function getAppName (appInstance) {
  if (require._eak_seen['dummy/config/environment']) {
    // if we have the dummy/config, we're running the dummy app and the main bundle is dummy.js
    return 'dummy';
  }
  if (appInstance.base) {
    return appInstance.base.name;
  }
  return appInstance.application.name;
}

export function initialize(appInstance) {
  if (!window.LiveReload) {
    return;
  }
  let appName = getAppName(appInstance);

  const Plugin = createPlugin(appName, lookup(appInstance, 'service:hot-reload'));
  window.LiveReload.addPlugin(Plugin);
}

export default {
  name: 'hot-loader-livereload-plugin',
  initialize
};
