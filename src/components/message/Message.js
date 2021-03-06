import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Snackbar } from '@material-ui/core';
import { clearMessage } from '../../actions/message';

// TODO: Merge with AlertSnackbar
const Message = ({ message, clearMessage }) =>
    message && (
        <Snackbar
            open={true}
            message={message}
            autoHideDuration={5000}
            onClose={clearMessage}
        />
    );

Message.propTypes = {
    message: PropTypes.string,
    clearMessage: PropTypes.func.isRequired,
};

export default connect(({ message }) => ({ message }), { clearMessage })(
    Message
);
