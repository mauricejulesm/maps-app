import React from 'react';
import PropTypes from 'prop-types';
import ColorPicker from '../core/ColorPicker';

const styles = {
    item: {
        whiteSpace: 'nowrap',
    },
    color: {
        display: 'inline-block',
        width: 32,
        height: 32,
        margin: '0 8px 0 0',
    },
    label: {
        display: 'inline-block',
        height: 24,
        lineHeight: '32px',
        verticalAlign: 'top',
        overflow: 'hidden',
    },
};

const OptionStyle = ({ name, color, onChange }) => (
    <div style={styles.item}>
        <ColorPicker color={color} onChange={onChange} style={styles.color} />
        <span style={styles.label}>{name}</span>
    </div>
);

OptionStyle.propTypes = {
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default OptionStyle;
