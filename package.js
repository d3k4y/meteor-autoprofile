Package.describe({
    summary: "Generate profile pages / data-sheets based on simpl-schema",
    version: "0.0.12",
    name: "d3k4y:meteor-autoprofile",
    git: "https://github.com/d3k4y/meteor-autoprofile"
});

Npm.depends({});

Package.onUse(function (api) {
    api.versionsFrom('1.6');

    api.use([
        'templating@1.3.2',
        'check',
        'ecmascript',
        'jquery',
        'tracker',
        'reactive-var',
        'aldeed:template-extension@4.1.0',
        'corefi:meteor-autoform-enhanced-method@0.0.1',
        'corefi:meteor-simple-schema-functions@0.0.1',
    ]);

    api.use([
        'aldeed:autoform@6.3.0',
        'd3k4y:autoform-modals@0.4.3',
        'd3k4y:files@1.10.0',
        'd3k4y:autoform-files@2.2.0'
    ], 'client', {weak: true});

    api.use([
        'babrahams:editable-text@0.9.10',
    ], ['client', 'server'], {weak: true});

    api.mainModule('client.js', 'client');
    api.mainModule('server.js', 'server');
});
