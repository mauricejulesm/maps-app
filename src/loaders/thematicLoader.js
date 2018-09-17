import i18next from 'i18next';
import { getInstance as getD2 } from 'd2/lib/d2';
import findIndex from 'lodash/fp/findIndex';
import sortBy from 'lodash/fp/sortBy';
import pick from 'lodash/fp/pick';
import curry from 'lodash/fp/curry';
import { toGeoJson } from '../util/map';
import { dimConf } from '../constants/dimension';
import { getLegendItems, getLegendItemForValue } from '../util/classify';
import { getDisplayProperty } from '../util/helpers';
import { loadDataItemLegendSet } from '../util/legend';
import {
    getOrgUnitsFromRows,
    getPeriodFromFilters,
    getDataItemFromColumns,
    getApiResponseNames,
} from '../util/analytics';
import { defaultClasses, defaultColorScale } from '../util/colorscale';
import { createAlert } from '../util/alerts';

const thematicLoader = async config => {
    const { columns, radiusLow, radiusHigh } = config;
    const [features, data] = await loadData(config);
    const names = getApiResponseNames(data);
    const valueById = getValueById(data);
    const valueFeatures = features.filter(
        ({ id }) => valueById[id] !== undefined
    );
    const orderedValues = getOrderedValues(data);
    const minValue = orderedValues[0];
    const maxValue = orderedValues[orderedValues.length - 1];
    const dataItem = getDataItemFromColumns(columns);
    const name = names[dataItem.id];
    let legendSet = config.legendSet;
    let method = legendSet ? 1 : config.method; // Favorites often have wrong method

    // Check if data item has legend set (needed if config is converted for chart/pivot layout)
    if (!legendSet && !method) {
        legendSet = await loadDataItemLegendSet(dataItem);
    }

    const legend = legendSet
        ? await createLegendFromLegendSet(legendSet)
        : createLegendFromConfig(orderedValues, config);
    const getLegendItem = curry(getLegendItemForValue)(legend.items);
    let alerts = [];

    legend.title = name;
    legend.items.forEach(item => (item.count = 0));
    legend.period = names[data.metaData.dimensions.pe[0]];

    if (!valueFeatures.length) {
        alerts.push(createAlert(name, i18next.t('No data found')));
    }

    valueFeatures.forEach(({ id, geometry, properties }) => {
        const value = valueById[id];
        const item = getLegendItem(value);

        // A predefined legend can have a shorter range
        if (item) {
            item.count++;
            properties.color = item.color;
            properties.legend = item.name; // Shown in data table
            properties.range = `${item.startValue} - ${item.endValue}`; // Shown in data table
        }

        properties.value = value;
        properties.radius =
            (value - minValue) /
                (maxValue - minValue) *
                (radiusHigh - radiusLow) +
            radiusLow;
        properties.type = geometry.type; // Shown in data table
    });

    return {
        ...config,
        data: valueFeatures,
        name,
        legend,
        method,
        ...(alerts.length ? { alerts } : {}),
        isLoaded: true,
        isExpanded: true,
        isVisible: true,
    };
};

// Returns an object mapping org. units and values
const getValueById = data => {
    const { headers, rows } = data;
    const ouIndex = findIndex(['name', 'ou'], headers);
    const valueIndex = findIndex(['name', 'value'], headers);

    return rows.reduce((obj, row) => {
        obj[row[ouIndex]] = parseFloat(row[valueIndex]);
        return obj;
    }, {});
};

// Returns an array of ordered values
const getOrderedValues = data => {
    const { headers, rows } = data;
    const valueIndex = findIndex(['name', 'value'], headers);

    return rows.map(row => parseFloat(row[valueIndex])).sort((a, b) => a - b);
};

// Returns a legend created from a pre-defined legend set
const createLegendFromLegendSet = async legendSet => {
    const d2 = await getD2();
    const { legends } = await d2.models.legendSet.get(legendSet.id);
    const pickSome = pick(['name', 'startValue', 'endValue', 'color']);

    return {
        items: sortBy('startValue', legends)
            .map(pickSome)
            .map(
                item =>
                    item.name === `${item.startValue} - ${item.endValue}`
                        ? { ...item, name: '' } // Clear name if same as startValue - endValue
                        : item
            ),
    };
};

const createLegendFromConfig = (data, config) => {
    const {
        method = 2, // TODO: Make constant
        classes = defaultClasses,
        colorScale = defaultColorScale,
    } = config;

    const items = data.length ? getLegendItems(data, method, classes) : [];
    const colors = colorScale.split(',');

    return {
        items: items.map((item, index) => ({
            ...item,
            color: colors[index],
        })),
    };
};

// Load features and data values from api
const loadData = async config => {
    const {
        rows,
        columns,
        filters,
        displayProperty,
        userOrgUnit,
        valueType,
        relativePeriodDate,
        aggregationType,
    } = config;
    const orgUnits = getOrgUnitsFromRows(rows);
    const period = getPeriodFromFilters(filters);
    const dataItem = getDataItemFromColumns(columns);
    const isOperand = columns[0].dimension === dimConf.operand.objectName;
    const d2 = await getD2();
    const displayPropertyUpper = getDisplayProperty(
        d2,
        displayProperty
    ).toUpperCase();
    const geoFeaturesParams = {};
    let orgUnitParams = orgUnits.map(item => item.id);
    let dataDimension = isOperand ? dataItem.id.split('.')[0] : dataItem.id;

    if (valueType === 'ds') {
        dataDimension += '.REPORTING_RATE';
    }

    let analyticsRequest = new d2.analytics.request()
        .addOrgUnitDimension(orgUnits.map(ou => ou.id))
        .addDataDimension(dataDimension)
        .addPeriodFilter(period.id)
        .withDisplayProperty(displayPropertyUpper);

    if (Array.isArray(userOrgUnit) && userOrgUnit.length) {
        geoFeaturesParams.userOrgUnit = userOrgUnit.join(';');
        analyticsRequest = analyticsRequest.withUserOrgUnit(userOrgUnit);
    }

    if (relativePeriodDate) {
        analyticsRequest = analyticsRequest.withRelativePeriodDate(
            relativePeriodDate
        );
    }

    if (aggregationType) {
        analyticsRequest = analyticsRequest.withAggregationType(
            aggregationType
        );
    }

    if (isOperand) {
        analyticsRequest = analyticsRequest.addDimension('co');
    }

    // Features request
    const orgUnitReq = d2.geoFeatures
        .byOrgUnit(orgUnitParams)
        .displayProperty(displayPropertyUpper)
        .getAll(geoFeaturesParams)
        .then(toGeoJson);

    // Data request
    const dataReq = d2.analytics.aggregate.get(analyticsRequest);

    // Return promise with both requests
    return Promise.all([orgUnitReq, dataReq]);
};

export default thematicLoader;
