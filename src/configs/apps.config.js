const env = require('./env.config');

const { createApp: createApps2App } = require('@apps2App/app');
const { buildDependencies: buildApps2Dependencies } = require('@apps2/bootstrap');

const { createApp: createNotifyApp } = require('@notifyApp/app');
const { buildDependencies: buildNotifyDependencies } = require('@notify/bootstrap');


const appsConfig = [
  {
    appName: 'apps2',
    enabled: env.apps2Enabled,
    mountPath: '/apps2',
    buildDependencies: buildApps2Dependencies,
    createApp: createApps2App
  },
  {
    appName: 'notify',
    enabled: env.notifierEnabled,
    mountPath: '/notifier',
    buildDependencies: buildNotifyDependencies,
    createApp: createNotifyApp
  }
];

module.exports = { appsConfig };