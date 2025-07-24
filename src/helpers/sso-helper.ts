/// <reference path="../../../../node_modules/@types/office-runtime/index.d.ts" />

import { FileContentDBService } from "../dbServices/fileContentService";
import strings from "../strings";

import { handleClientSideErrors } from "./error-handler";
import { dialogFallback } from "./fallbackauthdialog";
import { callAllMessage, callGetUserData, callMessageAttachmentByDraftId, callMessageAttachmentById, callMessageById, callNewestDraftMessage, callRequestAddAttachment, callRequestCreateUploadSession, callSendEmailHasMessageId, callSendMessage } from "./middle-tier-calls";

import { jwtDecode } from 'jwt-decode';

let retryGetMiddletierToken = 0;
const fileContentDBService = new FileContentDBService();

export async function addAttachmentToEmail(callback, data_json): Promise<void> {
  try {
    saveToLocalStorage('addAttachmentToEmail', 1);
    // saveToLocalStorage(JSON.stringify(data_json), 2);
    await fileContentDBService.saveFileContentData(JSON.stringify(data_json)).then(async () => {
      console.log("Save successfully")
    });
    let middletierToken: string = await common_get_token();
    let response: any = await callRequestAddAttachment(middletierToken, data_json);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callRequestAddAttachment(mfaMiddletierToken, data_json);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getUserData(callback): Promise<void> {
  try {
    // Save the name of function callback into localstorage;
    saveToLocalStorage('getUserData', 1);

    // Get the token from the Office host
    let middletierToken: string = await common_get_token();
    let response: any = await callGetUserData(middletierToken);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      // Microsoft Graph requires an additional form of authentication. Have the Office host
      // get a new token using the Claims string, which tells AAD to prompt the user for all
      // required forms of authentication.
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callGetUserData(mfaMiddletierToken);
    }

    // AAD errors are returned to the client with HTTP code 200, so they do not trigger
    // the catch block below.
    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getMessageByID(callback, emailID): Promise<void> {
  try {
    saveToLocalStorage('getMessageByID', 1);
    saveToLocalStorage(emailID, 3);
    let msGraphToken: string = await common_get_token();
    let response: any = await callMessageById(msGraphToken, emailID);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callMessageById(mfaMiddletierToken, emailID);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getNewsMessageDraft(callback): Promise<void> {
  try {
    saveToLocalStorage('getNewsMessageDraft', 1);
    let msGraphToken: string = await common_get_token();
    let response: any = await callNewestDraftMessage(msGraphToken);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callNewestDraftMessage(mfaMiddletierToken);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getMessageAttachmentByID(callback, emailID): Promise<void> {
  try {
    saveToLocalStorage('getMessageAttachmentByID', 1);
    saveToLocalStorage(emailID, 3);
    let msGraphToken: string = await common_get_token();
    let response: any = await callMessageAttachmentById(msGraphToken, emailID);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callMessageAttachmentById(mfaMiddletierToken, emailID);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      return callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getMessageAttachmentByID_2(emailID): Promise<any> {
  try {
    let msGraphToken: string = await common_get_token();
    let response: any = await callMessageAttachmentById(msGraphToken, emailID);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callMessageAttachmentById(mfaMiddletierToken, emailID);
    }

    // if (response.error) {
    //   handleAADErrors(response, callback);
    // } else {
      return response;
    // }
  } catch (exception) {
    // proccess_handle_error(exception, callback);
  }
}

export async function getMessageAttachmentByDraftID(callback, emailID): Promise<void> {
  try {
    saveToLocalStorage('getMessageAttachmentByDraftID', 1);
    saveToLocalStorage(emailID, 3);
    let msGraphToken: string = await common_get_token();
    let response: any = await callMessageAttachmentByDraftId(msGraphToken, emailID);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callMessageAttachmentByDraftId(mfaMiddletierToken, emailID);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function createUploadSession(callback, data_json): Promise<void> {
  try {
    let middletierToken: string = await common_get_token();
    let response: any = await callRequestCreateUploadSession(middletierToken, data_json);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callRequestCreateUploadSession(mfaMiddletierToken, data_json);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function getMessages(callback): Promise<void> {
  try {
    saveToLocalStorage('getMessages', 1);
    let middletierToken: string = await common_get_token();
    let response: any = await callAllMessage(middletierToken);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callAllMessage(mfaMiddletierToken);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function requestUploadLargeAttachment(callback, data_json): Promise<void> {
  try {
    let middletierToken: string = await common_get_token();

    let response: any = await requestUploadLargeAttachment(middletierToken, data_json);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = requestUploadLargeAttachment(mfaMiddletierToken, data_json);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function sendMessages(callback, data_json): Promise<void> {
  try {
    saveToLocalStorage('sendMessages', 1);
    saveToLocalStorage(JSON.stringify(data_json), 2);
    let middletierToken: string = await common_get_token();
    let response: any = await callSendMessage(middletierToken, data_json);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callSendMessage(mfaMiddletierToken, data_json);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

export async function sendMessagesHasId(callback, emailID): Promise<void> {
  try {
    saveToLocalStorage('sendMessagesHasId', 1);
    saveToLocalStorage(emailID, 3);
    let middletierToken: string = await common_get_token();
    let response: any = await callSendEmailHasMessageId(middletierToken, emailID);
    if (!response) {
      throw new Error("Middle tier didn't respond");
    } else if (response.claims) {
      let mfaMiddletierToken: string = await getMiddletierToken(response);
      response = callSendEmailHasMessageId(mfaMiddletierToken, emailID);
    }

    if (response.error) {
      handleAADErrors(response, callback);
    } else {
      callback(response);
    }
  } catch (exception) {
    proccess_handle_error(exception, callback);
  }
}

async function common_get_token() {
  let resultToken: string = "";
  const currentEmail = localStorage.getItem("default-account");
  const tokens: { accessToken: string, email: string }[] = JSON.parse(localStorage.getItem("msgraph-tokens") || "[]");
  
  if (tokens.length === 0) {
    try {
      resultToken = await OfficeRuntime.auth.getAccessToken({
        allowSignInPrompt: true,
        allowConsentPrompt: true,
        forMSGraphAccess: false,
      });
      tokens.push({ accessToken: resultToken, email: currentEmail });
      localStorage.setItem("msgraph-tokens", JSON.stringify(tokens));
      return resultToken;
    } catch (exception) {
      throw exception;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    resultToken = token.accessToken;
    const emailOfToken = token.email;

    if (!isTokenExpired(resultToken) && emailOfToken === currentEmail) {
      return resultToken;
    }
  }

  try {
    resultToken = await OfficeRuntime.auth.getAccessToken({
      allowSignInPrompt: true,
      allowConsentPrompt: true,
      forMSGraphAccess: false,
    });

    // Check if there's already a token associated with the current email
    const index = tokens.findIndex(token => token.email === currentEmail);
    if (index !== -1) {
      // Update the existing token
      tokens[index].accessToken = resultToken;
    } else {
      // Add a new token
      tokens.push({ accessToken: resultToken, email: currentEmail });
    }

    localStorage.setItem("msgraph-tokens", JSON.stringify(tokens));
    return resultToken;
  } catch (exception) {
    throw exception;
  }
}

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) {
      // Token or expiration claim is missing
      return true;
    }

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    return decoded.exp < currentTime;
  } catch (error) {
    // Error decoding token
    console.error('Error decoding token:', error);
    return true;
  }
}

function saveToLocalStorage(value: string, type: number) {
  switch(type){
    case 1:
      localStorage.setItem(strings.LS_MSG_CALLBACKFUNC, value);
      break;
    case 2:
      localStorage.setItem(strings.LS_MSG_JSON_DATA, value);
      break;
    case 3:
      localStorage.setItem(strings.LS_MSG_ITEMID, value);
      break;
  }
}

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

async function getMiddletierToken(response: any) {
  return await OfficeRuntime.auth.getAccessToken({
      authChallenge: response.claims,
  });
}

async function proccess_handle_error(exception: any, callback) {
  // if handleClientSideErrors returns true then we will try to authenticate via the fallback
  // dialog rather than simply throw and error
  if (exception.code == 13008 || exception.code == 13006 || exception.code == 130010) {
    if (localStorage.getItem("isEncryptPath") === "false") {
      callback(exception)
    } else {
      return;
    }
  } else {
    if (exception.code) {
      if (handleClientSideErrors(exception)) {
        dialogFallback(callback);
      } else {
        let response: any = {"error": "Failed to authenticate user. Please try again."};
        callback(response);
      }
    } else {
      console.error("EXCEPTION: " + JSON.stringify(exception));
      throw exception;
    }
  }
}

async function handleAADErrors(response: any, callback: any): Promise<void> {
  // On rare occasions the middle tier token is unexpired when Office validates it,
  // but expires by the time it is sent to AAD for exchange. AAD will respond
  // with "The provided value for the 'assertion' is not valid. The assertion has expired."
  // Retry the call of getAccessToken (no more than once). This time Office will return a
  // new unexpired middle tier token.

  if (response.error_description.indexOf("AADSTS500133") !== -1 && retryGetMiddletierToken <= 0) {
    retryGetMiddletierToken++;

    const callbackFuncName = getValueFromLocalStorage(1);
    const callbackJSON = (callbackFuncName !== "addAttachmentToEmail" ?  getValueFromLocalStorage(2) : (await fileContentDBService.getFileContentData()));
    const callbackItemID = getValueFromLocalStorage(3);
    switch (callbackFuncName) {
      case "addAttachmentToEmail":
        addAttachmentToEmail(callback, callbackJSON);
        break;
      case "getUserData":
        getUserData(callback);
        break;
      case "getMessageByID":
        getMessageByID(callback, callbackItemID);
        break;
      case "getNewsMessageDraft":
        getNewsMessageDraft(callback);
        break;
      case "getMessageAttachmentByID":
        getMessageAttachmentByID(callback, callbackItemID);
        break;
      case "getMessageAttachmentByDraftID":
        getMessageAttachmentByDraftID(callback, callbackItemID);
        break;
      case "getMessages":
        getMessages(callback);
        break;
      case "sendMessages":
        sendMessages(callback, callbackJSON);
        break;
      case "sendMessagesHasId":
        sendMessagesHasId(callback, callbackItemID);
        break;
      default:
        break;
    }
  } else {
    dialogFallback(callback);
  }
}
