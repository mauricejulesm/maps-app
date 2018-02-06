import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import union from 'lodash/fp/union';
import { init, config, getUserSettings } from 'd2/lib/d2';
import PluginMap from './components/map/PluginMap';
import { mapRequest } from './util/requests';
import { fetchLayer } from './loaders/layers';
import { configI18n } from './util/i18n';
import { translateConfig } from './util/favorites';
import '../scss/plugin.scss';

// Inspiration:
// pivot: https://github.com/dhis2/pivot-tables-app/blob/master/src/plugin.js
// d2-analysis: https://github.com/dhis2/d2-analysis/blob/master/src/util/Plugin.js

const apiVersion = 29;

const Plugin = () => {
    let _configs = [];
    let _components = {};
    let _isReady = false;
    let _isPending = false;

    function getType() {
        return 'MAP';
    }

    function add(...configs) {
        configs = Array.isArray(configs[0]) ? configs[0] : configs;

        if (configs.length) {
            _configs = [..._configs, ...configs];
            configs.forEach(renderLoadingIndicator);
        }
    }

    function load(...configs) {
        add(Array.isArray(configs[0]) ? configs[0] : configs);

        if (_isReady) {
            onInit();
        } else if (!_isPending) {
            _isPending = true;
            const { url, username, password } = this;
            initialize(url, username, password);
        }
    }

    function initialize(url, username, password) {
        if (url) {
            config.baseUrl = `${url}/api/${apiVersion}`;
        }

        if (username && password) {
            config.context = {auth: `${username}:${password}`};
        }

        config.schemas = union(config.schemas, [
            'dataElement',
            'dataSet',
            'indicator',
            'legendSet',
            'map',
            'optionSet',
            'organisationUnitGroup',
            'organisationUnitGroupSet',
            'programStage'
        ]);

        getUserSettings()
            .then(configI18n)
            .then(init)
            .then(onInit);
    }

    function onInit() {
        _isReady = true;

        while (_configs.length) {
            loadMap(_configs.shift());
        }
    }

    function loadMap(config) {
        if (config.id && !isUnmounted(config.el)) { // Load favorite
            mapRequest(config.id)
                .then(favorite => loadLayers({
                    ...config,
                    ...favorite,
                }));
        } else {
            loadLayers(translateConfig(config));
        }
    }

    function loadLayers(config) {
        if (config.mapViews && !isUnmounted(config.el)) {
            Promise.all(config.mapViews.map(fetchLayer)).then(mapViews => drawMap({
                ...config,
                mapViews,
            }));
        }
    }

    function drawMap(config) {
        if (config.el && !isUnmounted(config.el)) {
            const domEl = document.getElementById(config.el);

            if (domEl) {
                render(<PluginMap {...config} />, domEl);
                _components[config.el] = 'rendered';
            }
        }
    }

    function renderLoadingIndicator(config) {
        if (config.el) {
            const domEl = document.getElementById(config.el);

            if (domEl) {
                domEl.innerHTML = ''; // TODO: Remove when unmount is used
                const div = document.createElement('div');
                div.className = 'spinner';
                domEl.appendChild(div);
                _components[config.el] = 'loading';
            }
        }
    }

    function unmount(el) {
        const mapComponent = _components[el];

        if (mapComponent) {
            _components[el] = 'unmounted';

            const domEl = document.getElementById(el);

            if (domEl) {
                if (mapComponent === 'loading') {
                    domEl.innerHTML = ''; // Remove spinner
                    return true;
                } else if (mapComponent === 'rendered') {
                    return unmountComponentAtNode(domEl);
                }
            }
        }

        return false;
    }

    function isUnmounted(el) {
        return el && _components[el] === 'unmounted';
    }

    return { // Public properties
        url: null,
        username: null,
        password: null,
        loadingIndicator: false,
        getType,
        load,
        add,
        unmount,
    };
};

const mapPlugin = new Plugin();

global.mapPlugin = mapPlugin;

export default mapPlugin;