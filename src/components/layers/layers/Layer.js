import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import i18n from '@dhis2/d2-i18n';

const styles = theme => ({
    container: {
        float: 'left',
        width: 120,
        marginRight: 16,
        cursor: 'pointer',
        boxSizing: 'border-box',
        height: 160,
    },

    image: {
        boxSizing: 'border-box',
        border: `1px solid ${theme.palette.divider}`,
        width: 120,
        height: 120,
    },

    noImage: {
        boxSizing: 'border-box',
        border: `1px solid ${theme.palette.divider}`,
        width: 120,
        height: 120,
        lineHeight: '120px',
        background: theme.palette.background.default,
        color: theme.palette.text.hint,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },

    name: {
        fontSize: 14,
        color: theme.palette.text.secondary,
        paddingBottom: 20,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
    },
});

const Layer = ({ classes, layer, onClick }) => {
    const { img, type, name } = layer;
    const label = name || i18n.t(type);

    return (
        <div
            className={classes.container}
            onClick={() => onClick(layer)}
            data-test={`addlayeritem-${label}`}
        >
            {img ? (
                <img src={img} className={classes.image} />
            ) : (
                <div className={classes.noImage}>
                    {i18n.t('External layer')}
                </div>
            )}
            <div className={classes.name}>{label}</div>
        </div>
    );
};

Layer.propTypes = {
    classes: PropTypes.object.isRequired,
    layer: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default withStyles(styles)(Layer);
