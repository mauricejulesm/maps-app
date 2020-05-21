import { getInstance as getD2 } from 'd2';
import { isObject } from 'lodash/fp';

const propertyMap = {
    name: 'name',
    displayName: 'name',
    shortName: 'shortName',
    displayShortName: 'shortName',
};

export const getDisplayProperty = (d2, displayProperty) => {
    const keyAnalysisDisplayProperty =
        d2.currentUser.settings.keyAnalysisDisplayProperty;
    return (
        propertyMap[keyAnalysisDisplayProperty] ||
        propertyMap[displayProperty] ||
        'name'
    ); // TODO: check
};

/*
export const getDisplayPropertyUrl = d2 => {
    return `${getDisplayProperty(d2)}~rename(name)`; // TODO
};
*/

export const getDisplayPropertyUrl = () => `displayName~rename(name)`;

const baseFields = [
    'id',
    'user',
    'displayName~rename(name)',
    'longitude',
    'latitude',
    'zoom',
    'basemap',
    'publicAccess',
];

const analysisFields = async () => {
    const d2 = await getD2();
    const namePropertyUrl = await getDisplayPropertyUrl(d2);
    return [
        '*',
        `columns[dimension,filter,items[dimensionItem~rename(id),dimensionItemType,${namePropertyUrl}]]`,
        `rows[dimension,filter,items[dimensionItem~rename(id),dimensionItemType,${namePropertyUrl}]]`,
        `filters[dimension,filter,items[dimensionItem~rename(id),dimensionItemType,${namePropertyUrl}]]`,
        'organisationUnits[id,path]', // Added to retrieve org unit paths
        'dataDimensionItems',
        `program[id,${namePropertyUrl}]`,
        'programStage[id,displayName~rename(name)]',
        'legendSet[id,displayName~rename(name)]',
        'trackedEntityType[id,displayName~rename(name)]',
        'organisationUnitSelectionMode',
        '!lastUpdated',
        '!href',
        '!created',
        '!publicAccess',
        '!rewindRelativePeriods',
        '!userOrganisationUnit',
        '!userOrganisationUnitChildren',
        '!userOrganisationUnitGrandChildren',
        '!externalAccess',
        '!access',
        '!relativePeriods',
        '!columnDimensions',
        '!rowDimensions',
        '!filterDimensions',
        '!user',
        '!organisationUnitGroups',
        '!itemOrganisationUnitGroups',
        '!userGroupAccesses',
        '!indicators',
        '!dataElements',
        '!dataElementOperands',
        '!dataElementGroups',
        '!dataSets',
        '!periods',
        '!organisationUnitLevels',
        '!sortOrder',
        '!topLimit',
    ];
};

export const mapFields = async () => {
    const fields = await analysisFields();
    return `${baseFields.join(',')}, mapViews[${fields.join(',')}]`;
};

export const legendFields = [
    '*',
    '!created',
    '!lastUpdated',
    '!displayName',
    '!externalAccess',
    '!access',
    '!userGroupAccesses',
];

export const legendSetFields = [
    'id,displayName~rename(name),legends[' + legendFields.join(',') + ']',
];

// Add path to org unit dimension  - https://jira.dhis2.org/browse/DHIS2-4212
export const addOrgUnitPaths = mapViews =>
    mapViews.map(view =>
        view.rows && view.organisationUnits
            ? {
                  ...view,
                  rows: view.rows.map(dim => ({
                      ...dim,
                      items: dim.items.map(orgUnit => ({
                          ...orgUnit,
                          path: (
                              view.organisationUnits.find(
                                  ou => ou.id === orgUnit.id
                              ) || {}
                          ).path,
                      })),
                  })),
              }
            : view
    );

const mandatoryDataItemAttributes = ['id', 'name', 'valueType'];

// Checks if a data item is valid (program stage data elements and tracked entity attributes)
export const getValidDataItems = items =>
    items.filter(
        item =>
            isObject(item) &&
            mandatoryDataItemAttributes.every(prop => prop in item)
    );

// Returns split view layer if exist
export const getSplitViewLayer = layers =>
    layers.find(layer => layer.renderingStrategy === 'SPLIT_BY_PERIOD');

// Checks if split view map
export const isSplitViewMap = layers => !!getSplitViewLayer(layers);

export const formatCoordinate = value => {
    try {
        return JSON.parse(value)
            .map(v => v.toFixed(6))
            .join(', ');
    } catch (e) {
        return value;
    }
};

// Formats a DHIS2 time string
export const formatTime = time =>
    `${time.substring(0, 10)} ${time.substring(11, 16)}`;
