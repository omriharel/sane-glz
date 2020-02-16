import { baseApiUrl } from './constants';

const iterateObject = (object, f) => {
    Object.entries(object).forEach(([key, value]) => {
        f(key, value);
    });
}

const buildInitialOnlineData = () => {
    const result = {};

    iterateObject(localStorage, (key, value) => {
        if (notAnAuthKey(key)) {
            result[key] = JSON.parse(value);
        }
    });

    return result;
}

const notAnAuthKey = (key) => {
    return key !== 'loggedIn' &&
        key !== 'username' &&
        key !== 'authAccessToken' &&
        key !== 'onlineDataFetched' &&
        key !== 'onlineDataTimestamp';
}

const getAuthInfo = () => {
    const loggedIn = getStored('loggedIn') || false;
    const username = getStored('username') || null;
    const authAccessToken = getStored('authAccessToken') || null;
    const onlineDataFetched = getStored('onlineDataFetched') || false;

    const userdataUrl = loggedIn ? `${baseApiUrl}/userdata` : null;

    return [loggedIn, username, authAccessToken, onlineDataFetched, userdataUrl];
}

const getLocallyStored = (key) => {
    let item = localStorage.getItem(key);

    return item ? JSON.parse(item) : null;
}

const syncInitialOnlineData = () => {
    const [, username, authAccessToken,, userdataUrl] = getAuthInfo();

    const dataToSync = buildInitialOnlineData();

    return fetch(userdataUrl, {
        method: 'PUT',
        body: JSON.stringify({
            key: null,
            value: dataToSync
        }),
        headers: {
            'Content-Type': 'application/json',
            Authorization: authAccessToken,
        },
    }).catch(error => {
        console.error(`Error when syncing local data remotely for user ${username}`, error);
    });
}

const locallyStore = (key, item) => {
    localStorage.setItem(key, JSON.stringify(item));
}

export const fetchOnlineData = (callback) => {
    const [loggedIn, username, authAccessToken,, userdataUrl] = getAuthInfo();

    if (loggedIn) {
        fetch(userdataUrl, {
            headers: {
                Authorization: authAccessToken
            }
        })
        .then(response => response.json())
        .then(data => {
            locallyStore('onlineDataFetched', true);

            // there is existing data to maybe load
            if (data.last_updated) {

                const onlineDataTimestamp = getStored('onlineDataTimestamp') || null;
                locallyStore('onlineDataTimestamp', data.last_updated);

                // newer data exists remotely, take it
                if (!onlineDataTimestamp || (onlineDataTimestamp && data.last_updated > onlineDataTimestamp)) {
                    iterateObject(data.data, locallyStore);
                    callback();
                // we have the newer data locally but haven't yet seen the data from the server,
                // so overwrite the remote data with ours
                } else {
                    syncInitialOnlineData().then(callback);
                }
            // our data is definitely the only version, safe to sync
            } else {
                syncInitialOnlineData().then(callback);
            }
        })
        .catch(error => {
            console.error(`Failed to fetch user data for ${username}`, error);
        });
    }
}

export const getStored = (key) => {
    return getLocallyStored(key);
}

export const store = (key, item, localOnly) => {
    if (!notAnAuthKey(key)) {
        locallyStore(key, item);
        return;
    }

    locallyStore(key, item);

    if (localOnly) {
        return;
    }

    const [loggedIn, username, authAccessToken, onlineDataFetched, userdataUrl] = getAuthInfo();

    if (loggedIn && onlineDataFetched) {
        fetch(userdataUrl, {
            method: 'PUT',
            body: JSON.stringify({
                key: key,
                value: item,
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: authAccessToken,
            },
        }).catch(error => {
            console.error(`Error when saving keyed data remotely for user ${username}`, error);
        });
    }
}

export const resetStorage = () => {
    const [loggedIn, username, authAccessToken,, userdataUrl] = getAuthInfo();

    localStorage.clear();

    if (loggedIn) {
        fetch(userdataUrl, {
            method: 'PUT',
            body: null,
            headers: {
                Authorization: authAccessToken
            },
        }).catch(error => {
            console.error(`Error when deleting remote data for user ${username}`, error);
        });
    }
}
