/*global ga, gsStorage, gsSession, gsUtils */
// eslint-disable-next-line no-unused-vars
var gsAnalytics = function() {
  'use strict';

  const DIMENSION_VERSION = 'dimension1';
  const DIMENSION_SCREEN_CAPTURE = 'dimension2';
  const DIMENSION_SUSPEND_TIME = 'dimension3';
  const DIMENSION_DONATED = 'dimension4';
  const DIMENSION_DISCARD_AFTER_SUSPEND = 'dimension5';

  const METRIC_SUSPENDED_TAB_COUNT = 'metric1';
  const METRIC_TOTAL_TAB_COUNT = 'metric2';
  const METRIC_TAB_CHECK_TIME_TAKEN = 'metric3';
  const METRIC_TAB_RECOVER_TIME_TAKEN = 'metric4';

  function initAsPromised() {
    return new Promise(function(resolve) {
      if (gsStorage.getOption('trackingOptOut')) {
        gsUtils.log(
          'gsAnalytics',
          'init tracking aborted because tracking is disabled'
        );
        resolve();
      }
      try {
        ga('create', 'UA-167314577-2', 'auto');
        ga('set', 'checkProtocolTask', function() {});
        ga('require', 'displayfeatures');
      } catch (e) {
        gsUtils.warning('gsAnalytics', e);
      }
      gsUtils.log('gsAnalytics', 'init successful');
      resolve();
    });
  }

  function setUserDimensions() {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'setting dimensions aborted because tracking is disabled'
      );
      return;
    }
    const dimensions = {
      [DIMENSION_VERSION]: chrome.runtime.getManifest().version + '',
      [DIMENSION_SCREEN_CAPTURE]:
        gsStorage.getOption(gsStorage.SCREEN_CAPTURE) + '',
      [DIMENSION_SUSPEND_TIME]:
        gsStorage.getOption(gsStorage.SUSPEND_TIME) + '',
      [DIMENSION_DONATED]: gsStorage.getOption(gsStorage.NO_NAG) + '',
      [DIMENSION_DISCARD_AFTER_SUSPEND]:
        gsStorage.getOption(gsStorage.DISCARD_AFTER_SUSPEND) + '',
    };
    gsUtils.log('gsAnalytics', 'Setting dimensions', dimensions);
    ga('set', dimensions);
  }

  function performStartupReport() {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'perfomStartupReport aborted because tracking is disabled'
      );
      return;
    }
    const category = 'System';
    const action = gsSession.getStartupType();

    const metrics = {};
    const sessionMetrics = gsStorage.fetchSessionMetrics();
    if (sessionMetrics && sessionMetrics[gsStorage.SM_TIMESTAMP]) {
      metrics[METRIC_SUSPENDED_TAB_COUNT] =
        sessionMetrics[gsStorage.SM_SUSPENDED_TAB_COUNT];
      metrics[METRIC_TOTAL_TAB_COUNT] =
        sessionMetrics[gsStorage.SM_TOTAL_TAB_COUNT];
    }
    const tabCheckTimeTaken = gsSession.getTabCheckTimeTakenInSeconds();
    if (!isNaN(tabCheckTimeTaken) && parseInt(tabCheckTimeTaken) >= 0) {
      metrics[METRIC_TAB_CHECK_TIME_TAKEN] = tabCheckTimeTaken;
    }
    const recoveryTimeTaken = gsSession.getRecoveryTimeTakenInSeconds();
    if (!isNaN(recoveryTimeTaken) && parseInt(recoveryTimeTaken) >= 0) {
      metrics[METRIC_TAB_RECOVER_TIME_TAKEN] = recoveryTimeTaken;
    }
    gsUtils.log('gsAnalytics', 'Event: ', category, action, metrics);
    ga('send', 'event', category, action, metrics);
  }

  function performVersionReport() {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'performVersionReport aborted because tracking is disabled'
      );
      return;
    }
    const startupType = gsSession.getStartupType();
    if (!['Install', 'Update'].includes(startupType)) {
      return;
    }

    const category = 'Version';
    const action = startupType + 'Details';
    const startupLastVersion = gsSession.getStartupLastVersion();
    const curVersion = chrome.runtime.getManifest().version;
    const label =
      startupLastVersion !== curVersion
        ? `${startupLastVersion} -> ${curVersion}`
        : curVersion;

    gsUtils.log('gsAnalytics', 'Event: ', category, action, label);
    ga('send', 'event', category, action, label);
  }

  function performPingReport() {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'performPingReport aborted because tracking is disabled'
      );
      return;
    }
    const category = 'System';
    const action = 'Ping';

    const metrics = {};
    const sessionMetrics = gsStorage.fetchSessionMetrics();
    if (sessionMetrics && sessionMetrics[gsStorage.SM_TIMESTAMP]) {
      metrics[METRIC_SUSPENDED_TAB_COUNT] =
        sessionMetrics[gsStorage.SM_SUSPENDED_TAB_COUNT];
      metrics[METRIC_TOTAL_TAB_COUNT] =
        sessionMetrics[gsStorage.SM_TOTAL_TAB_COUNT];
    }
    gsUtils.log('gsAnalytics', 'Event: ', category, action, metrics);
    ga('send', 'event', category, action, metrics);
  }

  function reportPageView(pageName) {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'reportPageView aborted because tracking is disabled'
      );
      return;
    }
    ga('send', 'pageview', pageName);
  }
  function reportEvent(category, action, label) {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'reportEvent aborted because tracking is disabled'
      );
      return;
    }
    ga('send', 'event', category, action, label);
  }
  function reportException(errorMessage) {
    if (gsStorage.getOption('trackingOptOut')) {
      gsUtils.log(
        'gsAnalytics',
        'reportException aborted because tracking is disabled'
      );
      return;
    }
    ga('send', 'exception', {
      exDescription: errorMessage,
      exFatal: false,
    });
  }
  return {
    initAsPromised,
    performStartupReport,
    performVersionReport,
    performPingReport,
    setUserDimensions,
    reportPageView,
    reportEvent,
    reportException,
  };
};

function loadGoogleAnalytics(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  (i[r] =
    i[r] ||
    function() {
      (i[r].q = i[r].q || []).push(arguments);
    }),
    (i[r].l = 1 * new Date());
  (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
}

function init() {
  if (!gsStorage.getOption('trackingOptOut')) {
    loadGoogleAnalytics(
      window,
      document,
      'script',
      'https://www.google-analytics.com/analytics.js',
      'ga'
    );
  }
  gsAnalytics = gsAnalytics();
}

if (document.readyState == 'complete') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    init();
  });
}
