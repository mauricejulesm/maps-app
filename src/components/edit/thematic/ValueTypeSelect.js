import React from 'react';
import PropTypes from 'prop-types';
import i18n from '@dhis2/d2-i18n';
import { SelectField } from '@dhis2/d2-ui-core';
import { dimConf } from '../../../constants/dimension';

const ValueTypeSelect = props => {
    const { value, onChange } = props;

    // TODO: Avoid creating on each render (needs to be created after i18next contains translations
    const items = [
        { id: dimConf.indicator.objectName, name: i18n.t('Indicator') },
        { id: dimConf.dataElement.objectName, name: i18n.t('Data element') },
        { id: dimConf.dataSet.objectName, name: i18n.t('Reporting rates') },
        {
            id: dimConf.eventDataItem.objectName,
            name: i18n.t('Event data items'),
        },
        {
            id: dimConf.programIndicator.objectName,
            name: i18n.t('Program indicators'),
        },
    ];

    return (
        <SelectField
            {...props}
            label={i18n.t('Item type')}
            items={items}
            value={value}
            onChange={valueType => onChange(valueType.id)}
        />
    );
};

ValueTypeSelect.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

export default ValueTypeSelect;
