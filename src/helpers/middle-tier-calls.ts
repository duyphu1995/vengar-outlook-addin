// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license in the root of the repo.
/*
    This file provides the provides functionality to get Microsoft Graph data.
*/

import * as $ from "jquery";
import { MSGraph_API_URL } from "../consts";

export async function callGetUserData(middletierToken: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", "/getuserdata", middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callAllMessage(middletierToken: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", "/messages", middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callMessageById(middletierToken: string, emailID: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", `/messageById?emailId=${emailID}`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callMessageAttachmentById(middletierToken: string, emailID: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", `/messageAttachmentById?emailId=${emailID}`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callMessageAttachmentByDraftId(middletierToken: string, emailID: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", `/messageAttachmentByDraftId?emailId=${emailID}`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callNewestDraftMessage(middletierToken: string): Promise<any> {
  try {
    return await callAPIMSGraph("GET", `/getNewestDraftMessage`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callDeleteAttachment(middletierToken: string, emailID: string, attachmentID): Promise<any> {
  try {
    return await callAPIMSGraph("DELETE", `/getNewestDraftMessage?emailId=${emailID}?attachmentID=${attachmentID}`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callSendMessage(middletierToken: string, data_json: string): Promise<any> {
  try {
    return await callAPIMSGraphWithData("POST", "/sendMessage", middletierToken, data_json)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callRequestAddAttachment(middletierToken: string, data_json: string): Promise<any> {
  try {
    return await callAPIMSGraphWithData("POST", `/addAttachment`, middletierToken, data_json)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callSendEmailHasMessageId(middletierToken: string, messageId: string): Promise<any> {
  try {
    return await callAPIMSGraph("POST", `/sendMessage?messageId=${messageId}`, middletierToken)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callRequestCreateUploadSession(middletierToken: string, data_json: string): Promise<any> {
  try {
    return await callAPIMSGraphWithData("POST", `/createUploadSession`, middletierToken, data_json)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

export async function callRequestUploadLargeAttachment(middletierToken: string, data_json: string): Promise<any> {
  try {
    return await callAPIMSGraphWithData("POST", `/requestUploadLargeAttachment`, middletierToken, data_json)
  } catch (err) {
    console.error(`Error from middle tier. \n${err.responseText || err.message}`);
    throw err;
  }
}

async function callAPIMSGraph(method: string, endpoint: string, token: string): Promise<any> {
  try {
    const response = await $.ajax({
      type: method,
      url: MSGraph_API_URL + endpoint,
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${token}` },
      cache: false,
    });
    return response;
  } catch (err) {
    throw err;
  }
}

async function callAPIMSGraphWithData(method: string, endpoint: string, token: string, data_json: string): Promise<any> {
  try {
    const response = await $.ajax({
      type: method,
      url: MSGraph_API_URL +  endpoint,
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${token}` },
      cache: false,
      data: data_json
    });
    return response;
  } catch (err) {
    throw err;
  }
}