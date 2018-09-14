Package.describe({
    summary: "Generate profile pages / data-sheets based on simpl-schema",
    version: "0.0.1",
    name: "d3k4y:meteor-autoprofile",
    git: "https://github.com/d3k4y/meteor-autoprofile"
});

Npm.depends({});

Package.onUse(function (api) {
    api.versionsFrom('1.6');

    api.use([
        'templating',
        'check',
        'ecmascript',
        'jquery',
        'tracker',
        'reactive-var',
        'aldeed:template-extension@4.1.0',
        'corefi:meteor-simple-schema-functions@0.0.1',
    ]);

    api.mainModule('client.js', 'client');
    api.mainModule('server.js', 'server');
});
