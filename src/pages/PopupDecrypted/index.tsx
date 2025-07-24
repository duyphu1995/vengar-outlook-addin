import "../../App.scss";
import "./index.scss";

import { AuthResource, BaseResource, requestDecryption } from "@ebi/api-client";
import { AES, SHA } from "@ebi/cryptography";
import { useAccounts, useAuth, useKeys } from "@ebi/hooks";
import { VDecryptResponse, VResponseCode, VSecureFile, VSecureFileIndex } from "@ebi/protobuffers";
import React, { useCallback, useEffect, useState } from "react";
import { TokenIPInfo, URL_IPInfo, VExt } from "../../consts";

import * as $ from "jquery";
import moment from "moment";
import { useController } from "rest-hooks";
import AsyncBoundary from "../../components/AsyncBoundary";
import LoadingSpinner from "../../components/LoadingSpinner";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";
import strings from "../../strings";
import Container from "./Container";
import styles from "./PopupDecrypted.module.scss";
import QRCode from "./QRCode";

import { ConfigProvider, StorageProvider } from "@ebi/hooks";
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { CacheProvider } from "rest-hooks";
import { FileContentDBService } from "../../dbServices/fileContentService";

import ErrorModal from "../../components/ErrorModal";

import { VConfigApp, VConvertBase64StringToArrayBuffer, VFormatTimeForDecrypt, delay } from "../../ultils/VUltils";

const fileContentDBService = new FileContentDBService();
const defaultAccount = localStorage.getItem("default-account");
const OFFICE_DEVICE_PLATFORM = localStorage.getItem(strings.LS_DEVICE_PLATFORM);

type StepName = "loading" | "decryption" | "verify-qr" | "view" | "close-popup" | "show-popup";

function getGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const { geolocation } = window.navigator;
    if (!geolocation) reject(new Error("Web browser doesn't support geolocation"));
    geolocation.getCurrentPosition(resolve, reject);
  });
}

function renderLoading() {
  return (
    <div className={styles.loading}>
      <LoadingSpinner />
    </div>
  );
}

function Open() {
  const { accounts } = useAccounts();
  const { getAccessToken } = useAuth();
  const keys = useKeys();

  const { fetch } = useController();

  const [error, setError] = useState<Error | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileIV, setFileIV] = useState<Uint8Array>(new Uint8Array());
  const [fileSeed, setFileSeed] = useState<Uint8Array>(new Uint8Array());
  const [ignorePosition, setIgnorePosition] = useState<boolean | null>(null);
  const [index, setIndex] = useState<VSecureFileIndex | null>(null);
  const [hash, setHash] = useState<Uint8Array>(new Uint8Array());
  const [secureFile, setSecureFile] = useState<VSecureFile | null>(null);
  const [serverResponse, setServerResponse] = useState<VDecryptResponse | null>(null);
  const [step, setStep] = useState<StepName>("decryption");

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [positionError, setPositionError] = useState<GeolocationPositionError | null>(null);
  const [latitude, setLatitude] = useState<string>(null);
  const [longitude, setLongtitude] = useState<string>(null);

  const [itemEmail, setItemEmail] = useState<any>(null);

  useEffect(() => {
    if (ignorePosition) return;
    if (positionError) return;

    if (OFFICE_DEVICE_PLATFORM === "Mac") {
      if (latitude || longitude) return;

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
  }, [ignorePosition, position, positionError, latitude, longitude]);

  useEffect(() => {
    if (step !== "loading") return;
    if (!accounts) return;

    const token = getAccessToken(defaultAccount); //accounts?.map(({ email }) => getAccessToken(email)).find((token) => !!token);
    if (token) return;
  }, [accounts, getAccessToken, step]);

  // With account, location and secureFile, request decryption keys
  useEffect(() => {
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

    (async () => {
      const currEmail = JSON.parse(localStorage.getItem(strings.LS_MAIL_ITEM));
      setItemEmail(currEmail);
    })();

    const token = getAccessToken(defaultAccount);
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
          setError(new Error(err?.message));
        } else setError(new Error(strings.pageOpenQRCodeError));
      }
    })();
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
  ]);

  // With successful serverResponse, decrypt
  useEffect(() => {
    const decrypt = async () => {
      if (!secureFile || !secureFile.header) return;
      if (!serverResponse || !serverResponse.serverSeed || serverResponse?.response?.code !== VResponseCode.SUCCESS)
        return;

      const { iv: serverIV, seed } = serverResponse.serverSeed;
      const serverKey = await AES.importKey(seed);

      const fs = await AES.decrypt(serverKey, serverIV, secureFile.header.seed);
      setFileSeed(fs);
      const fiv = await AES.decrypt(serverKey, serverIV, secureFile.header.seedIv);
      setFileIV(fiv);
      const fileKey = await AES.importKey(fs);

      const indexBytes = await AES.decrypt(fileKey, fiv, secureFile.index);
      const idx = VSecureFileIndex.decode(indexBytes);

      setIndex(idx);

      setStep("view");
    };
    decrypt();
  }, [secureFile, serverResponse]);

  const onDecrypting = async (data) => {
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

  const handleDecryption = async () => {
    while ((await fileContentDBService.getFileContentData()) === undefined) {
      await delay(500);
      setStep("loading");
    }
    const fileBase64String = await fileContentDBService.getFileContentData();
    const fileContent = VConvertBase64StringToArrayBuffer(fileBase64String);
    await onDecrypting(fileContent);
  };

  const onQRVerified = useCallback(() => {
    setServerResponse(null);
    setStep("loading");
  }, []);

  const onCloseContainer = useCallback(() => {
    setError(null);
    setFile(null);
    setHash(new Uint8Array());
    setSecureFile(null);
    setServerResponse(null);
    setStep("close-popup");
  }, []);

  // If we have a position error, then what? Can you prompt again?
  // console.log("positionError", positionError);
  console.log("latitude", OFFICE_DEVICE_PLATFORM === "Mac" ? latitude : position?.coords.latitude);
  console.log("longtitude", OFFICE_DEVICE_PLATFORM === "Mac" ? longitude : position?.coords.longitude);
  console.log("error", error);

  function renderError(titleError: string) {
    return <ErrorModal error={error} header={titleError} onHide={onCloseContainer}></ErrorModal>;
  }

  function renderQRCode() {
    if (!serverResponse || !serverResponse.qr) return null;

    return (
      <QRCode
        isCompose={false}
        itemEmail={{
          author: itemEmail.from.emailAddress.address,
          attachmentName: localStorage.getItem(strings.attachmentName),
          displayName: itemEmail.from.emailAddress.name,
          receipients: getRecipient(),
          subject: itemEmail.subject,
          timeSent: VFormatTimeForDecrypt(itemEmail.sentDateTime),
        }}
        qr={serverResponse.qr}
        onVerified={onQRVerified}
      />
    );
  }

  function getRecipient(): string {
    const recipients = itemEmail.toRecipients;
    if (!recipients || recipients.length === 0) {
      return "";
    }
    return recipients
      .map((recipient) => (recipient.EmailAddress ? recipient.EmailAddress.Address : recipient.emailAddress.address))
      .join("; ");
  }

  function renderContainer() {
    if (!secureFile?.header) return null;
    if (!serverResponse) return null;
    if (!index) return null;
    return (
      <Container
        author={serverResponse.author}
        authorizedUsers={serverResponse.authorizedUsers}
        subject={secureFile.header.description}
        drmForward={serverResponse.allowForward}
        drm={serverResponse.drm}
        fileId={serverResponse.fileId}
        fileIV={fileIV}
        fileName={file?.name || ""}
        fileSeed={fileSeed}
        index={index}
        partitions={secureFile.partitions}
        sunrise={serverResponse.sunriseDate ? moment(serverResponse.sunriseDate.epochUTC).toDate() : null}
        sunset={serverResponse.sunsetDate ? moment(serverResponse.sunsetDate.epochUTC).toDate() : null}
      />
    );
  }

  function renderDecryption() {
    handleDecryption();
    return <></>;
  }

  function renderClosePopup() {
    Office.context.ui.messageParent(strings.closeDialog);
    return <></>;
  }

  function renderStep() {
    switch (step) {
      case "loading":
        return renderLoading();
      case "decryption":
        return renderDecryption();
      case "verify-qr":
        return renderQRCode();
      case "view":
        return renderContainer();
      case "close-popup":
        return renderClosePopup();
      default:
        return null;
    }
  }

  if (error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes(strings.headerTooltipLocation.toLowerCase())) {
      return renderError(strings.pageSecureErrorTitle);
    } else {
      return renderError(error.name);
    }
  }

  return <>{renderStep()}</>;
}

function LoadingFallback() {
  return null;
}

export default function OpenWithSuspense() {
  BaseResource.apiUrl = process.env.REACT_APP_API_URL!;
  return (
    <CacheProvider>
      <ConfigProvider config={VConfigApp()}>
        <StorageProvider storage={localStorage}>
          <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={renderLoading}>
            <Open />
          </AsyncBoundary>
        </StorageProvider>
      </ConfigProvider>
    </CacheProvider>
  );
}

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

Office.onReady(() => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(
    <Suspense fallback={LoadingFallback()}>
      <OpenWithSuspense />
    </Suspense>
  );
});
