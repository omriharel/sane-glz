import React, { useEffect } from 'react'; // eslint-disable-line no-unused-vars

import { Redirect } from 'react-router-dom';

import { store } from './helpers';

export default function Logout() {
    store('loggedIn', false);
    store('username', null);
    store('authAccessToken', null);

    return <Redirect to="/" />;
}
