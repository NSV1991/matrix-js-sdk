/*
Copyright 2023 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fetchMock from "fetch-mock-jest";

/**
 * Mock out the endpoints that the js-sdk calls when we call `MatrixClient.start()`.
 *
 * @param homeserverUrl - the homeserver url for the client under test
 */
export function mockInitialApiRequests(homeserverUrl: string) {
    fetchMock.getOnce(new URL("/_matrix/client/versions", homeserverUrl).toString(), { versions: ["r0.5.0"] });
    fetchMock.getOnce(new URL("/_matrix/client/r0/pushrules/", homeserverUrl).toString(), {});
    fetchMock.postOnce(new URL("/_matrix/client/r0/user/%40alice%3Alocalhost/filter", homeserverUrl).toString(), {
        filter_id: "fid",
    });
}

/**
 * Mock the requests needed to set up cross signing
 *
 * Return 404 error for `GET _matrix/client/r0/user/:userId/account_data/:type` request
 * Return `{}` for `POST _matrix/client/v3/keys/signatures/upload` request (named `upload-sigs` for fetchMock check)
 * Return `{}` for `POST /_matrix/client/(unstable|v3)/keys/device_signing/upload` request (named `upload-keys` for fetchMock check)
 */
export function mockSetupCrossSigningRequests(): void {
    // have account_data requests return an empty object
    fetchMock.get("express:/_matrix/client/r0/user/:userId/account_data/:type", {
        status: 404,
        body: { errcode: "M_NOT_FOUND", error: "Account data not found." },
    });

    // we expect a request to upload signatures for our device ...
    fetchMock.post({ url: "path:/_matrix/client/v3/keys/signatures/upload", name: "upload-sigs" }, {});

    // ... and one to upload the cross-signing keys (with UIA)
    fetchMock.post(
        // legacy crypto uses /unstable/; /v3/ is correct
        {
            url: new RegExp("/_matrix/client/(unstable|v3)/keys/device_signing/upload"),
            name: "upload-keys",
        },
        {},
    );
}
