import { useCallback, useContext, useEffect, useState } from "react";

import { AuthResource, requestDecryption } from "@ebi/api-client";
import { AES, SHA } from "@ebi/cryptography";
import { useAccounts, useAuth, useKeys } from "@ebi/hooks";
import {
  VDecryptResponse,
  VResponseCode,
  VSecureFile,
  VSecureFileIndex,
  VSecureFilePartition,
  VSecureFilePartitionType,
} from "@ebi/protobuffers";

import React from "react";

import AsyncBoundary from "../../components/AsyncBoundary";
import Encryption from "../../components/Encryption";
import ErrorModal from "../../components/ErrorModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";

import {
  VConvertBase64StringToArrayBuffer,
  VConvertTimeToUTC,
  VDecreaseByOneMinute,
  VFormatTime,
  VParseToHTMLFormat,
  VRemoveTags,
  VSizeBase64String,
} from "../../ultils/VUltils";

import moment from "moment";
import { useController } from "rest-hooks";
import { getMessageAttachmentByID, getMessageByID, getMessages, getNewsMessageDraft } from "../../helpers/sso-helper";

import QRCode from "../PopupDecrypted/QRCode";
import Context from "../Secure/Context";

import * as $ from "jquery";

import VersionNumber from "../../components/VersionNumber";
import { TokenIPInfo, URL_IPInfo, VExt } from "../../consts";
import strings from "../../strings";
import { VOJS_Get_Attachments, VOJS_Get_HTMLBody, VOJS_RemoveAttachments } from "../../ultils/VOfficeUltils";

var mailBox: Office.Mailbox;
var item;

var orgEmailUserInput = [];

const OFFICE_DEVICE_PLATFORM = localStorage.getItem(strings.LS_DEVICE_PLATFORM);
const DEFAULT_ACCOUNT = localStorage.getItem("default-account");

var topEmails: any = null; // list email get from folder inbox
var lastestDraftEmail: any = null; // lastest draft email
var messageEmailDecrypted: string = null; // message email decrypted

type StepName = "loading" | "verify-qr" | "view";
type LoadingState = "Getting the origin mail..." | "Decrypting..." | "Replacing...";

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

Office.onReady(async () => {
  // set value for mailbox and mail item
  console.log("Office is ready!");

  mailBox = Office.context.mailbox;
  item = mailBox.item;
});

function renderLoading(step?: string) {
  return <LoadingSpinner page="encrypt" step={step} />;
}

function getGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const { geolocation } = window.navigator;
    if (!geolocation) {
      reject(new Error("Web browser doesn't support geolocation"));
    }
    geolocation.getCurrentPosition(resolve, reject);
  });
}

function Encrypt() {
  const { error, setDialog, setError } = useContext(Context);
  const [composeType, setComposeType] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState<StepName>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("Getting the origin mail...");

  const { accounts } = useAccounts();
  const currAccount = accounts?.find((a) => a.email === mailBox.userProfile.emailAddress);

  // Get type of compose
  // The function item.getComposeTypeAsync return 3 types of compose:
  //    1. New Mail ("newMail")
  //    2. Forward: ("forward")
  //    3. Reply / Reply all ("reply")
  item.getComposeTypeAsync(function (asyncResult) {
    // if success -> set state for ComposeType
    if (asyncResult.status == Office.AsyncResultStatus.Succeeded) {
      setComposeType(asyncResult.value.composeType);
    }
    // if error -> set state for error to show Error popup
    else {
      setError(asyncResult.error);
    }
  });

  useEffect(() => {
    setStep(composeType !== "newMail" ? "loading" : isLoggedIn ? "view" : "loading");
  }, [composeType, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      (async () => {
        await getNewestMessageDraft();
      })();
    }
  }, [isLoggedIn]);

  async function getNewestMessageDraft() {
    try {
      await getNewsMessageDraft(process_getNewestMessageDraft_sendEmail);
    } catch (error) {
      setError(new Error(error?.message));
    }
  }

  async function process_getNewestMessageDraft_sendEmail(result: any) {
    if (result.error) {
      setError(new Error(result.error));
    } else {
      setIsLoggedIn(true);
    }
  }

  async function getContentOfOriginEmail() {
    await getMessages(process_get_messsage);
  }

  async function process_get_messsage(result: Object) {
    topEmails = result;
    await getNewsMessageDraft(process_get_messsage_draft);
  }

  async function process_get_messsage_draft(result: Object) {
    try {
      lastestDraftEmail = result;
      let bodyPreviewOfCurrentEmail = lastestDraftEmail.value[0].body.content;
      bodyPreviewOfCurrentEmail = VRemoveTags(bodyPreviewOfCurrentEmail);
      let timeSentOfOriginEmail = bodyPreviewOfCurrentEmail.substring(
        bodyPreviewOfCurrentEmail.indexOf(OFFICE_DEVICE_PLATFORM !== "Mac" ? "Sent:" : "Date: ") + "Sent:".length,
        bodyPreviewOfCurrentEmail.indexOf("To:")
      );
      timeSentOfOriginEmail = VRemoveTags(timeSentOfOriginEmail);

      let subjectOfOriginEmail = bodyPreviewOfCurrentEmail.substring(
        bodyPreviewOfCurrentEmail.indexOf("Subject:") + "Subject:".length,
        bodyPreviewOfCurrentEmail.indexOf("Secure Vault Notification")
      );

      subjectOfOriginEmail = VRemoveTags(subjectOfOriginEmail);

      const convertedTime = VConvertTimeToUTC(
        timeSentOfOriginEmail.replace(/,/g, "").trim() != ""
          ? timeSentOfOriginEmail.replace(/,/g, "").trim()
          : localStorage.getItem(strings.LS_SentDateTime_Origin)
      );

      timeSentOfOriginEmail.replace(/,/g, "").trim() &&
        localStorage.setItem(strings.LS_SentDateTime_Origin, timeSentOfOriginEmail.replace(/,/g, "").trim());

      subjectOfOriginEmail.trim() != "Au" &&
        localStorage.setItem(strings.LS_Subject_Origin, subjectOfOriginEmail.trim());

      const convertedTimeAndDecrease = VDecreaseByOneMinute(convertedTime);

      const filteredEmail = topEmails.value.filter(
        (element) =>
          (element.isDraft === false &&
            element.conversationId === lastestDraftEmail.value[0].conversationId &&
            element.subject.trim() ===
              (subjectOfOriginEmail.trim() != "Au"
                ? subjectOfOriginEmail.trim()
                : localStorage.getItem(strings.LS_Subject_Origin)) &&
            element.sentDateTime.substring(0, element.sentDateTime.length - 4) === convertedTime) ||
          element.sentDateTime.substring(0, element.sentDateTime.length - 4) === convertedTimeAndDecrease
      );

      if (filteredEmail.length < 1) {
        setError(new Error(strings.errorNotProtectedByEBIProduct));
        return;
      } else {
        const idOriginEmail = filteredEmail[0].id;
        localStorage.setItem(strings.itemID, idOriginEmail);
        await getMessageAttachmentByID(process_get_content_bytes, idOriginEmail);
      }
    } catch (error) {
      setError(error);
    }
  }

  function process_get_content_bytes(result: any) {
    onDecrypting(VConvertBase64StringToArrayBuffer(result.value[0].contentBytes));
  }

  var fileContent = null;

  const { getAccessToken } = useAuth();
  const keys = useKeys();

  const { fetch } = useController();

  const [ignorePosition, setIgnorePosition] = useState<boolean | null>(null);
  const [hash, setHash] = useState<Uint8Array>(new Uint8Array());
  const [secureFile, setSecureFile] = useState<VSecureFile | null>(null);
  const [serverResponse, setServerResponse] = useState<VDecryptResponse | null>(null);

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [positionError, setPositionError] = useState<GeolocationPositionError | null>(null);
  const [latitude, setLatitude] = useState<string>(null);
  const [longitude, setLongtitude] = useState<string>(null);

  useEffect(() => {
    if (composeType === "forward" && step == "loading") {
      VOJS_Get_Attachments(item).then(async (attachments) => {
        if (attachments.length == 1) fileContent = VConvertBase64StringToArrayBuffer(attachments[0]?.content);

        await VOJS_Get_HTMLBody(item)
          .then((data) => {
            const htmlBodyData = VParseToHTMLFormat(data);
            const pUserInputTags = htmlBodyData.getElementsByClassName(
              OFFICE_DEVICE_PLATFORM === "Mac" ? "MsoNormal" : "elementToProof"
            );
            const lstLenght = pUserInputTags.length > 17 ? pUserInputTags.length - 17 : pUserInputTags.length;
            for (let i = 0; i < lstLenght; i++) {
              orgEmailUserInput.push(pUserInputTags[i]);
            }
          })
          .catch((error) => {
            setError(error);
          });

        if (fileContent != null) {
          onDecrypting(fileContent);
        }
      });
    } else if (composeType === "reply" && step == "loading") {
      (async () => {
        await VOJS_Get_HTMLBody(item)
          .then((data) => {
            const htmlBodyData = VParseToHTMLFormat(data);
            const pUserInputTags = htmlBodyData.getElementsByClassName(
              OFFICE_DEVICE_PLATFORM === "Mac" ? "MsoNormal" : "elementToProof"
            );
            const lstLenght = pUserInputTags.length > 17 ? pUserInputTags.length - 17 : pUserInputTags.length;
            for (let i = 0; i < lstLenght; i++) {
              orgEmailUserInput.push(pUserInputTags[i]);
            }
          })
          .catch((error) => {
            setError(error);
          });

        await getContentOfOriginEmail();
      })();
    }
  }, [composeType]);

  useEffect(() => {
    if (composeType !== "newMail") {
      if (ignorePosition) {
        return;
      }
      if (positionError) {
        return;
      }
      if (OFFICE_DEVICE_PLATFORM === "Mac") {
        if (latitude || longitude) {
          return;
        }

        (async () => {
          try {
            $.ajax({
              url: URL_IPInfo + TokenIPInfo,
              dataType: "json",
              success: (data) => {
                setLatitude(data.loc.split(",")[0]);
                setLongtitude(data.loc.split(",")[1]);
              },
              error: (error) => {
                console.error("Error fetching public IP:", error);
              },
            });
          } catch (err: unknown) {
            setIgnorePosition(true);
            setPositionError(err as GeolocationPositionError);
          }
        })();
      } else {
        if (position) return;

        (async () => {
          try {
            const p = await getGeolocation();
            setPosition(p);
          } catch (err: unknown) {
            setIgnorePosition(true);
            if (err instanceof Error) {
              //   setIgnorePosition(true);
            } else {
              setPositionError(err as GeolocationPositionError);
            }
          }
        })();
      }
    }
  }, [ignorePosition, position, positionError, latitude, longitude]);

  useEffect(() => {
    if (step !== "loading") {
      return;
    }
    if (!accounts) {
      return;
    }
  }, [accounts, step]);

  useEffect(() => {
    if (composeType !== "newMail") {
      if (step !== "loading") return;

      if (!keys.symmetricKey) return;
      if (!accounts) return;
      if (!secureFile || !secureFile.header) return;

      if (OFFICE_DEVICE_PLATFORM === "Mac") {
        if (!latitude && !longitude && !ignorePosition) return;
      } else {
        if (!position && !ignorePosition) return;
      }

      if (serverResponse) return;

      const token = getAccessToken(DEFAULT_ACCOUNT);
      if (!token) return;
      else AuthResource.accessToken = token.accessToken;

      (async () => {
        try {
          const response = await fetch(requestDecryption, {
            fileId: secureFile.header?.fileId || "",
            hash,
            keys,
            latitude: OFFICE_DEVICE_PLATFORM === "Mac" ? latitude : position?.coords.latitude.toString(),
            longitude: OFFICE_DEVICE_PLATFORM === "Mac" ? longitude : position?.coords.longitude.toString(),
          });

          if (response.response && response.response.code !== VResponseCode.SUCCESS) {
            switch (response.response.code) {
              case VResponseCode.STATE_QR_REQUIRED:
                setStep("verify-qr");
                break;
              case VResponseCode.STATE_INVALID_GPS:
                setError(new Error(`Access Denied - ${response.response.text}`));
                break;
              case VResponseCode.SUNRISE_FAILED:
                setError(
                  new Error(
                    `Sunrise has not been reached\n\nThis Secure File can be opened after\n${moment(
                      response.sunriseDate?.epochUTC
                    ).format(strings.DATETIME_FORMAT)}`
                  )
                );
                break;
              case VResponseCode.SUNSET_FAILED:
                setError(
                  new Error(
                    `Sunset has passed\n\nThis Secure File cannot be opened after\n${moment(
                      response.sunsetDate?.epochUTC
                    ).format(strings.DATETIME_FORMAT)}`
                  )
                );
                break;
              case VResponseCode.STATE_UNAUTHORIZED_USER:
                setError(new Error(`Unauthorized User - ${response.response.text}`));
                break;
              default:
                setError(new Error(`Access Denied - ${response.response.text}`));
                break;
            }
          }

          setServerResponse(response);
        } catch (err) {
          if (err?.message == "No Content") {
            setStep(null)
            setError(new Error(err?.message));
          } else {
            setStep(null)
            setError(new Error(strings.pageOpenQRCodeError));
          }
          return;
        }
      })();
    }
  }, [
    fetch,
    getAccessToken,
    hash,
    ignorePosition,
    keys,
    position,
    latitude,
    longitude,
    secureFile,
    serverResponse,
    step,
    composeType,
  ]);

  // With successful serverResponse, decrypt
  useEffect(() => {
    if (composeType !== "newMail") {
      const decrypt = async () => {
        if (!secureFile || !secureFile.header) return;
        if (!serverResponse || !serverResponse.serverSeed || serverResponse?.response?.code !== VResponseCode.SUCCESS)
          return;

        const { iv: serverIV, seed } = serverResponse.serverSeed;
        const serverKey = await AES.importKey(seed);

        const fs = await AES.decrypt(serverKey, serverIV, secureFile.header.seed);
        const fiv = await AES.decrypt(serverKey, serverIV, secureFile.header.seedIv);
        const fileKey = await AES.importKey(fs);

        const indexBytes = await AES.decrypt(fileKey, fiv, secureFile.index);
        const index = VSecureFileIndex.decode(indexBytes);

        const indexes = index.items.reduce((acc, item, i) => {
          if ([VSecureFilePartitionType.HTML, VSecureFilePartitionType.NOTES].includes(item.type)) {
            return acc.concat([i]);
          }
          return acc;
        }, [] as number[]);
        const encryptedPartitions = indexes.map((i) => secureFile.partitions[i]);
        const partitionBytes = await Promise.all(
          encryptedPartitions.map((encryptedPartition) => AES.decrypt(fileKey, fiv, encryptedPartition))
        );
        const textDecoder = new TextDecoder("utf-8");
        const decodedPartitions = partitionBytes
          .map((bytes) => VSecureFilePartition.decode(bytes))
          .map((partition) => textDecoder.decode(partition.contents));

        messageEmailDecrypted = decodedPartitions[0];
        const itemID = localStorage.getItem(strings.itemID);
        await getMessageByID(process_get_messsage_by_id, itemID);
      };
      decrypt();
    }
  }, [secureFile, serverResponse]);

  function process_get_messsage_by_id(result: any) {
    setLoadingState("Replacing...");

    const usersWithoutAuthor = serverResponse.authorizedUsers.filter((u) => u !== currAccount.email && u !== "");
    const recipients = usersWithoutAuthor.join(";");
    const oneMB = 1024 * 1024;

    const timeSend = VFormatTime(result.sentDateTime); // format time with format en-US

    const template = VReplaceTemplateDecryptedEmail(
      currAccount.email,
      timeSend,
      recipients,
      secureFile.header.description,
      messageEmailDecrypted
    );

    const base64StringOfEmail = template.substring(template.indexOf("base64,") + 7, template.length);

    const sizeOfBase64 = VSizeBase64String(base64StringOfEmail);

    if (sizeOfBase64 <= oneMB) {
      onReplaceContentEmail(template).then((data) => {
        console.log("onReplaceContentEmail resolved, calling VOJS_RemoveAttachments");

        VOJS_RemoveAttachments(item);

        console.log("VOJS_RemoveAttachments resolved, calling onReplaceContentEmail again with template", template);

        onReplaceContentEmail(template).then((data) => {
          console.log("onReplaceContentEmail resolved again, setting step to view");

          setStep("view");
        });
      });
    } else {
      setError(new Error(strings.errorLimitAttachmentsInEmailBody));
    }
  }

  const onDecrypting = async (data) => {
    setLoadingState("Decrypting...");

    const fileBytes = new Uint8Array(data);
    const prefixBytes = fileBytes.slice(0, VExt.length);
    const decoder = new TextDecoder("utf-8");
    const prefix = decoder.decode(prefixBytes);

    if (prefix.toUpperCase() !== VExt.toUpperCase()) {
      setError(new Error(`This does not appear to be a ${VExt}`));
      return;
    }

    const remainingBytes = fileBytes.slice(VExt.length);
    const secureFile = VSecureFile.decode(remainingBytes);
    if (!secureFile.header) {
      setError(new Error("Secure File has no header"));
      return;
    }

    const hash = await SHA.hash(remainingBytes);

    setHash(hash);
    setSecureFile(secureFile);
    setStep("loading");
  };

  const onConfirmEncryptClick = async () => {
    setDialog("confirm-encrypt");
  };

  const onHideError = useCallback(async () => {
    if (error.toString() == `Error: ${strings.serverErrorOccurred}`) {
      window.location.reload();
    } else {
      Office.context.ui.closeContainer();
    }

    setError(null);

    if (!isLoggedIn) await getNewestMessageDraft();
  }, [isLoggedIn, error]);

  // Replace content email when decrypted
  // NOTE: work only on forward mode
  const onReplaceContentEmail = (template): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      item.body.setAsync(
        template,
        { coercionType: "html", asyncContext: "This is passed to the callback" },
        function callback(result) {
          if (result.status === Office.AsyncResultStatus.Failed) {
            reject(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  };

  const onQRVerified = useCallback(() => {
    setServerResponse(null);
    setStep("loading");
  }, []);

  function renderQRCode() {
    if (!serverResponse || !serverResponse.qr) {
      return null;
    }
    return <QRCode isCompose={true} qr={serverResponse.qr} onVerified={onQRVerified} />;
  }

  function VReplaceTemplateDecryptedEmail(
    author: string,
    timeSend: string,
    recipients: string,
    subject: string,
    htmlBody: string
  ) {
    const template =
      `<div class="customMail"></div><p><br data-cke-filler="true"></p><div style="font-family: Calibri, Arial, Helvetica, sans-serif;font-size: 12pt; color: rgb(0, 0, 0);" class="elementToProof">${
        OFFICE_DEVICE_PLATFORM == "Mac" ? "" : "<br>"
      }</div><div id="appendonsend"></div><hr tabindex="-1" style="display:inline-block; width:98%"><div id="divRplyFwdMsg" dir="ltr"><font face="Calibri, sans-serif" style="font-size: 11pt; color: rgb(0, 0, 0);"><b>Author:</b> ${author}<br><b>Sent:</b> ${timeSend} <br><b>Recipients:</b> ${recipients}<br><b>Subject:</b> ${subject}</font>${
        OFFICE_DEVICE_PLATFORM == "Mac" ? "" : "<div>&nbsp;</div>"
      }</div><div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);" class="elementToProof">${htmlBody}</div>`.replace(
        /^\s*&nbsp;/m,
        ""
      );

    let parsedTemplate = VParseToHTMLFormat(template);
    let divCustome = parsedTemplate.getElementsByClassName("customMail")[0];

    orgEmailUserInput.forEach((element) => {
      divCustome.appendChild(OFFICE_DEVICE_PLATFORM !== "Mac" ? element : element.firstChild);
      OFFICE_DEVICE_PLATFORM === "Mac" && divCustome.appendChild(document.createElement("br"));
    });

    return (
      "<!DOCTYPE html><html><head><title></title></head><body>" +
      new XMLSerializer().serializeToString(parsedTemplate) +
      "</body></html>"
    );
  }

  function renderContainer() {
    return (
      <Encryption
        account={currAccount}
        mailItem={item}
        dataDecrypted={
          composeType != "newMail"
            ? {
                allowForward: serverResponse ? serverResponse.allowForward : true,
                drm: {
                  allowCopy: serverResponse ? serverResponse.drm.allowCopy : true,
                  allowPrint: serverResponse ? serverResponse.drm.allowPrint : true,
                  allowSave: serverResponse ? serverResponse.drm.allowSave : true,
                },
                htmlBody: messageEmailDecrypted,
                actionEmail: composeType,
              }
            : null
        }
        onRemoveAttachment={VOJS_RemoveAttachments}
        onConfirmEncryptClick={onConfirmEncryptClick}
        onReplaceContentEmail={onReplaceContentEmail}
      />
    );
  }

  function renderStep() {
    switch (step) {
      case "loading":
        if (composeType != "newMail") {
          return renderLoading(loadingState);
        } else {
          return renderLoading();
        }
      case "verify-qr":
        return renderQRCode();
      case "view":
        return renderContainer();
      default:
        return null;
    }
  }

  return (
    <>
      {renderStep()}
      {
        <div
          style={{
            textAlign: "center",
            display: "flex",
            position: "absolute",
            bottom: "0",
            width: "100%",
            justifyContent: "center",
            margin: "5px",
          }}
        >
          <VersionNumber />
        </div>
      }
      <ErrorModal error={error} onHide={onHideError} />
    </>
  );
}

export default function EncryptWithSuspense() {
  return (
    <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={renderLoading}>
      <Encrypt />
    </AsyncBoundary>
  );
}
