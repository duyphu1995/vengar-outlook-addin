import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import { useAccounts } from "@ebi/hooks";

import classNames from "classnames";

import strings from "../../strings";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./Decryption.module.scss";

import { FileContentDBService } from "../../dbServices/fileContentService";
import { getMessageByID } from "../../helpers/sso-helper";
import { VOJS_ConvertToRestId } from "../../ultils/VOfficeUltils";
import { delay } from "../../ultils/VUltils";
import ErrorModal from "../ErrorModal";
import VersionNumber from "../VersionNumber";

const fileContentDBService = new FileContentDBService();
type StepName = "loading" | "render-decrypt-button" | "show-popup";

const DIALOG_WIDTH = 90;
const DIALOG_HEIGHT = 80;

export interface IDecryption {
  onGetAttachment: () => void;
}

export default function Decryption({ onGetAttachment }: IDecryption) {
  const [step, setStep] = useState<StepName>("loading");
  const [error, setError] = useState<Error>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { accounts } = useAccounts();

  let dialog: Office.Dialog;
  const { mailbox, ui } = Office.context;
  const { item } = mailbox;

  useEffect(() => {
    if (!isLoggedIn) {
      (async () => {
        await process_loading_message();
      })();
    } else {
      const deleteFileContentDB = async () => {
        await fileContentDBService.deleteFileContentData();
      };
      deleteFileContentDB();

      const getAttachment = async () => {
        try {
          await onGetAttachment();
        } catch (error) {
          setStep("loading");
          setError(error);
        }
      };
      getAttachment();

      const getFileContentData = async () => {
        while ((await fileContentDBService.getFileContentData()) === undefined) {
          await delay(500).then(async () => {
            const fileBase64String = await fileContentDBService.getFileContentData();
            if (fileBase64String !== undefined) {
              setError(null);
              setStep("render-decrypt-button");
            }
          });
        }
      };
      getFileContentData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (step !== "loading") return;
    if (!accounts) return;
  }, [accounts, step]);

  async function process_loading_message() {
    await getMessageByID(process_get_message_by_id, VOJS_ConvertToRestId(item?.itemId));
  }

  function process_get_message_by_id(result: any) {
    if (result.error) {
      setError(new Error(result.error));
    } else {
      setIsLoggedIn(true);
      localStorage.setItem(strings.LS_MAIL_ITEM, JSON.stringify(result));
    }
  }

  const onCloseDialog = () => {
    setError(null);
    ui.closeContainer();
  };

  function renderError(error: Error) {
    return <ErrorModal onHide={onCloseDialog} error={error} />;
  }

  function renderLoading() {
    return (
      <div className={styles.loading}>
        <LoadingSpinner page="decrypt" />
      </div>
    );
  }

  // render decrypt button
  function renderDecryptButton() {
    return (
      <div className={styles.decryptContainer}>
        <img src={require("../../assets/icons/decrypt-vault.png")} className={styles.decryptImage} />
        <Button className={classNames("mb-5", styles.btnDecrypt)} onClick={handleDecryption}>
          {strings.buttonDecrytValt}
        </Button>
      </div>
    );
  }
  const handleDecryption = async () => {
    setStep("show-popup");
  };

  function renderPopup() {
    ui.displayDialogAsync(
      window.location.origin + "/popupDecrypted.html",
      {
        height: DIALOG_HEIGHT,
        width: DIALOG_WIDTH,
        displayInIframe: true,
      },
      function (result) {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          dialog = result.value;

          dialog.addEventHandler(
            Office.EventType.DialogMessageReceived,
            function regis_EventDialogMessageReceived(arg) {
              if ("message" in arg) {
                dialog.close();
                if (arg.message === strings.closeDialog) {
                  dialog.close();
                  setStep("render-decrypt-button");
                } else if (arg.message === strings.closeDialogEndTime) {
                  setStep("render-decrypt-button");
                  setError(new Error(strings.descriptionClosePopup));
                }
              } else {
                console.log(arg.error);
              }
            }
          );

          dialog.addEventHandler(
            Office.EventType.DialogEventReceived,
            function processDialogEvent(arg: { error: number }) {
              switch (arg.error) {
                case 12002:
                  console.log(
                    "The dialog box has been directed to a page that it cannot find or load, or the URL syntax is invalid."
                  );
                  break;
                case 12003:
                  console.log("The dialog box has been directed to a URL with the HTTP protocol. HTTPS is required.");
                  break;
                case 12006:
                  setStep("render-decrypt-button");
                  break;
                default:
                  console.log("Unknown error in dialog box.");
                  break;
              }
            }
          );
        }
      }
    );
  }

  function renderStep() {
    switch (step) {
      case "loading":
        return renderLoading();
      case "render-decrypt-button":
        return renderDecryptButton();
      case "show-popup":
        return renderPopup();
      default:
        return null;
    }
  }

  return (
    <>
      {renderStep()}
      {error && renderError(error)}
      <div className={classNames(styles.versionText)}>
        <VersionNumber />
      </div>
    </>
  );
}
