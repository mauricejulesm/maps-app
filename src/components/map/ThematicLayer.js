import React, { Fragment } from 'react';
import i18n from '@dhis2/d2-i18n';
import Layer from './Layer';
import Timeline from '../periods/Timeline';
import PeriodName from './PeriodName';
import Popup from './Popup';
import { filterData } from '../../util/filter';
import { cssColor } from '../../util/colors';
import { getPeriodFromFilters } from '../../util/analytics';
import {
    LABEL_FONT_SIZE,
    LABEL_FONT_STYLE,
    LABEL_FONT_WEIGHT,
    LABEL_FONT_COLOR,
} from '../../constants/layers';

class ThematicLayer extends Layer {
    createLayer() {
        const {
            id,
            index,
            opacity,
            isVisible,
            data,
            dataFilters,
            labels,
            labelFontSize,
            labelFontStyle,
            labelFontWeight,
            labelFontColor,
            valuesByPeriod,
            renderingStrategy = 'SINGLE',
        } = this.props;

        const { period } = this.state;
        let periodData = data;

        if (renderingStrategy !== 'SINGLE') {
            const values = valuesByPeriod[period.id] || {};

            periodData = data
                .filter(feature => values[feature.id] !== undefined)
                .map(feature => ({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        ...values[feature.id],
                    },
                }));
        }

        const map = this.context.map;

        const config = {
            type: 'choropleth',
            id,
            index,
            opacity,
            isVisible,
            data: filterData(periodData, dataFilters),
            hoverLabel: '{name} ({value})',
            onClick: this.onFeatureClick.bind(this),
            onRightClick: this.onFeatureRightClick.bind(this),
        };

        if (labels) {
            const fontSize = labelFontSize || LABEL_FONT_SIZE;

            config.label = '{name}';
            config.labelStyle = {
                fontSize,
                fontStyle: labelFontStyle || LABEL_FONT_STYLE,
                fontWeight: labelFontWeight || LABEL_FONT_WEIGHT,
                color: cssColor(labelFontColor) || LABEL_FONT_COLOR,
                lineHeight: parseInt(fontSize, 10) * 1.2 + 'px',
            };
        }

        this.layer = map.createLayer(config);

        map.addLayer(this.layer);

        // Fit map to layer bounds once (when first created)
        this.fitBoundsOnce();
    }

    // Set initial period
    setPeriod(callback) {
        const { period, periods, renderingStrategy } = this.props;

        if (!period && !periods) {
            return;
        }

        const initialPeriod = {
            period:
                renderingStrategy === 'SINGLE' ? null : period || periods[0],
        };

        // setPeriod without callback is called from the constructor (unmounted)
        if (!callback) {
            this.state = initialPeriod;
        } else {
            this.setState(initialPeriod, callback);
        }
    }

    getPopup() {
        const { columns, aggregationType, legend } = this.props;
        const { popup, period } = this.state;
        const { coordinates, feature } = popup;
        const { name, value } = feature.properties;
        const indicator = columns[0].items[0].name || '';
        const periodName = period ? period.name : legend.period;

        return (
            <Popup
                coordinates={coordinates}
                onClose={() => this.onPopupClose(popup)}
                className="dhis2-map-popup-orgunit"
            >
                <em>{name}</em>
                <div>{indicator}</div>
                <div>{periodName}</div>
                <div>
                    {i18n.t('Value')}: {value}
                </div>
                {aggregationType && aggregationType !== 'DEFAULT' && (
                    <div>{aggregationType}</div>
                )}
            </Popup>
        );
    }

    render() {
        const { periods, renderingStrategy, filters } = this.props;
        const { period, popup } = this.state;
        const { id } = getPeriodFromFilters(filters);

        return (
            <Fragment>
                {renderingStrategy === 'TIMELINE' && period && (
                    <Fragment>
                        <PeriodName period={period.name} isTimeline={true} />
                        <Timeline
                            periodId={id}
                            period={period}
                            periods={periods}
                            onChange={this.onPeriodChange}
                        />
                    </Fragment>
                )}
                {popup && this.getPopup()}
            </Fragment>
        );
    }

    onPeriodChange = period => this.setState({ period });

    onFeatureClick(evt) {
        this.setState({ popup: evt });
    }
}

export default ThematicLayer;
