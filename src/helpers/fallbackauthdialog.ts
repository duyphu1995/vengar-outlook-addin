/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license in root of repo. -->
 *
 * This file shows how to use MSAL.js to get an access token to your server and pass it to the task pane.
 */

/* global console, localStorage, location, Office, window */

import { Configuration, LogLevel, PublicClientApplication, RedirectRequest } from "@azure/msal-browser";
import { callAllMessage, callGetUserData, callMessageAttachmentByDraftId, callMessageAttachmentById, callMessageById, callNewestDraftMessage, callRequestAddAttachment, callSendEmailHasMessageId, callSendMessage } from "./middle-tier-calls";
import { CLIENT_ID } from "../consts";
import strings from "../strings";

import { FileContentDBService } from "../dbServices/fileContentService";
const fileContentDBService = new FileContentDBService();

const clientId = CLIENT_ID; //This is your client ID
const accessScope = `api://${window.location.host}/${clientId}/access_as_user`;
const loginRequest: RedirectRequest = {
  scopes: [accessScope],
  extraScopesToConsent: ["user.read", "email", "mail.read", "mail.send", "mail.readwrite"],
};

function getValueFromLocalStorage(type: number) {
  switch (type) {
    case 1:
      return localStorage.getItem(strings.LS_MSG_CALLBACKFUNC);
    case 2:
      return localStorage.getItem(strings.LS_MSG_JSON_DATA);
    case 3:
      return localStorage.getItem(strings.LS_MSG_ITEMID);
  }
}

const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: `https://${window.location.host}/fallbackauthdialog.html`,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage", // Needed to avoid "User login is required" error.
    storeAuthStateInCookie: true, // Recommended to avoid certain IE/Edge issues.
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

const publicClientApp: PublicClientApplication = new PublicClientApplication(msalConfig);

let loginDialog: Office.Dialog = null;
let homeAccountId = null;
let callbackFunction = null;

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

Office.onReady(() => {
  if (Office.context.ui.messageParent) {
    publicClientApp
      .handleRedirectPromise()
      .then(handleResponse)
      .catch((error) => {
        console.log(error);
        Office.context.ui.messageParent(JSON.stringify({ status: "failure", result: error }));
      });

    // The very first time the add-in runs on a developer's computer, msal.js hasn't yet
    // stored login data in localStorage. So a direct call of acquireTokenRedirect
    // causes the error "User login is required". Once the user is logged in successfully
    // the first time, msal data in localStorage will prevent this error from ever hap-
    // pening again; but the error must be blocked here, so that the user can login
    // successfully the first time. To do that, call loginRedirect first instead of
    // acquireTokenRedirect.
    if (localStorage.getItem("loggedIn") === "yes") {
      publicClientApp.acquireTokenRedirect(loginRequest);
    } else {
      // This will login the user and then the (response.tokenType === "id_token")
      // path in authCallback below will run, which sets localStorage.loggedIn to "yes"
      // and then the dialog is redirected back to this script, so the
      // acquireTokenRedirect above runs.
      publicClientApp.loginRedirect(loginRequest);
    }
  }
});

function handleResponse(response) {
  if (response.tokenType === "id_token") {
    console.log("LoggedIn");
    localStorage.setItem("loggedIn", "yes");
  } else {
    console.log("token type is:" + response.tokenType);
    Office.context.ui.messageParent(
      JSON.stringify({ status: "success", result: response.accessToken, accountId: response.account.homeAccountId })
    );
  }
}

export async function dialogFallback(callback) {
  // Attempt to acquire token silently if user is already signed in.
  if (homeAccountId !== null) {
    const result = await publicClientApp.acquireTokenSilent(loginRequest);
    if (result !== null && result.accessToken !== null) {
      let response = null;

      const callbackFuncName = getValueFromLocalStorage(1);
      const callbackJSON = (callbackFuncName !== "addAttachmentToEmail" ?  getValueFromLocalStorage(2) : (await fileContentDBService.getFileContentData()));
      const callbackItemID = getValueFromLocalStorage(3);
      switch (callbackFuncName) {
        case "addAttachmentToEmail":
          response = await callRequestAddAttachment(result.accessToken, callbackJSON);
          break;
        case "getUserData":
          response = await callGetUserData(result.accessToken);
          break;
        case "getMessageByID":
          response = await callMessageById(result.accessToken, callbackItemID);
          break;
        case "getNewsMessageDraft":
          response = await callNewestDraftMessage(result.accessToken);
          break;
        case "getMessageAttachmentByID":
          response = await callMessageAttachmentById(result.accessToken, callbackItemID);
          break;
        case "getMessageAttachmentByDraftID":
          response = await callMessageAttachmentByDraftId(result.accessToken, callbackItemID);
          break;
        case "getMessages":
          response = await callAllMessage(result.accessToken);
          break;
        case "sendMessages":
          response = await callSendMessage(result.accessToken, callbackJSON);
          break;
        case "sendMessagesHasId":
          response = await callSendEmailHasMessageId(result.accessToken, clientId);
          break;
        default:
          break;
      }
      callbackFunction(response);
    }
  } else {
    callbackFunction = callback;

    // We fall back to Dialog API for any error.
    const url = "/fallbackauthdialog.html";
    showLoginPopup(url);
  }
}

// This handler responds to the success or failure message that the pop-up dialog receives from the identity provider
// and access token provider.
async function processMessage(arg) {
  // Uncomment to view message content in debugger, but don't deploy this way since it will expose the token.
  //console.log("Message received in processMessage: " + JSON.stringify(arg));

  let messageFromDialog = JSON.parse(arg.message);

  if (messageFromDialog.status === "success") {
    // We now have a valid access token.
    loginDialog.close();

    // Configure MSAL to use the signed-in account as the active account for future requests.
    const homeAccount = publicClientApp.getAccountByHomeId(messageFromDialog.accountId);
    if (homeAccount) {
      homeAccountId = messageFromDialog.accountId; // Track the account id for future silent token requests.
      publicClientApp.setActiveAccount(homeAccount);
    }

    let response = null;
    const callbackFuncName = getValueFromLocalStorage(1);
    const callbackJSON = (callbackFuncName !== "addAttachmentToEmail" ?  getValueFromLocalStorage(2) : (await fileContentDBService.getFileContentData()));
    const callbackItemID = getValueFromLocalStorage(3);
    switch (callbackFuncName) {
      case "addAttachmentToEmail":
        response = await callRequestAddAttachment(messageFromDialog.result, callbackJSON);
        break;
      case "getUserData":
        response = await callGetUserData(messageFromDialog.result);
        break;
      case "getMessageByID":
        response = await callMessageById(messageFromDialog.result, callbackItemID);
        break;
      case "getNewsMessageDraft":
        response = await callNewestDraftMessage(messageFromDialog.result);
        break;
      case "getMessageAttachmentByID":
        response = await callMessageAttachmentById(messageFromDialog.result, callbackItemID);
        break;
      case "getMessageAttachmentByDraftID":
        response = await callMessageAttachmentByDraftId(messageFromDialog.result, callbackItemID);
        break;
      case "getMessages":
        response = await callAllMessage(messageFromDialog.result);
        break;
      case "sendMessages":
        response = await callSendMessage(messageFromDialog.result, callbackJSON);
        break;
      case "sendMessagesHasId":
        response = await callSendEmailHasMessageId(messageFromDialog.result, clientId);
        break;
      default:
        break;
    }
    callbackFunction(response);
  } else if (messageFromDialog.error === undefined && messageFromDialog.result.errorCode === undefined) {
    // Need to pick the user to use to auth
  } else {
    // Something went wrong with authentication or the authorization of the web application.
    loginDialog.close();
    let response: any = {"error": "Failed to authenticate user. Please try again."};
    if (messageFromDialog.error) {
      console.error(JSON.stringify(messageFromDialog.error.toString()));
      callbackFunction(response);
    } else if (messageFromDialog.result) {
      console.error(JSON.stringify(messageFromDialog.result.errorMessage.toString()));
      callbackFunction(response);
    }
  }
}

// Use the Office dialog API to open a pop-up and display the sign-in page for the identity provider.
function showLoginPopup(url) {
  var fullUrl = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "") + url;
  // height and width are percentages of the size of the parent Office application, e.g., PowerPoint, Excel, Word, etc.
  Office.context.ui.displayDialogAsync(fullUrl, { height: 60, width: 30 }, function (result) {
    console.log("Dialog has initialized. Wiring up events");
    loginDialog = result.value;
    loginDialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
    loginDialog.addEventHandler(
            Office.EventType.DialogEventReceived,
            function processDialogEvent(arg: { error: number }) {
              let result: string = '';
              switch (arg.error) {
                case 12002:
                  result = "The dialog box has been directed to a page that it cannot find or load, or the URL syntax is invalid.";
                  break;
                case 12003:
                  result = "The dialog box has been directed to a URL with the HTTP protocol. HTTPS is required.";
                  break;
                case 12006:
                  result = "User closed the dialog box authentication";
                  break; 
                default:
                  result = "Unknown error in dialog box.";
                  break;
              }
              let response: any = {"error": result + ` Click Okey to continue.`};
              callbackFunction(response);
            }
          );
  });
}
