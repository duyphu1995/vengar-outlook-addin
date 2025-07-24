import { AuthResource, finishEncryption, startEncryption, template } from "@ebi/api-client";
import { Account, useAccounts, useAuth, useKeys } from "@ebi/hooks";
import {
  VCryptoHashFunction,
  VDRM,
  VResponseCode,
  VSecureFile,
  VSecureFileHeader,
  VSecureFileIndex,
  VSecureFileIndexItem,
  VSecureFilePartition,
  VSecureFilePartitionType,
} from "@ebi/protobuffers";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { AES, SHA } from "@ebi/cryptography";
import classNames from "classnames";
import kebabCase from "lodash/kebabCase";
import moment from "moment";
import { useController } from "rest-hooks";
import { decode, encode } from "uint8-to-base64";
import AsyncBoundary from "../../components/AsyncBoundary";
import ConfirmModal from "../../components/ConfirmModal";
import { How, Where } from "../../components/ConfirmModal/ConfirmModalItems";
import LoadingSpinner from "../../components/LoadingSpinner";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";
import { VExt } from "../../consts";
import Context, { ActionEmail, Attachment } from "../../pages/Secure/Context";
import Protections from "../../pages/Secure/Protections";
import strings from "../../strings";
import styles from "./Encryption.module.scss";

import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Vault, VaultWheel } from "../../assets";
import { addAttachmentToEmail, getNewsMessageDraft, sendMessagesHasId } from "../../helpers/sso-helper";
import {
  VOJS_Get_Attachments,
  VOJS_Get_HTMLBody,
  VOJS_Get_Recipient,
  VOJS_Get_Subject,
} from "../../ultils/VOfficeUltils";
import {
  VCheckIsExpired,
  VConcatArrays,
  VConvertBase64StringToArrayBuffer,
  VReplaceCommentHTML,
  VSizeBase64String,
  delay,
} from "../../ultils/VUltils";
import ErrorModal from "../ErrorModal";
import VersionNumber from "../VersionNumber";

const DateTimeFormat = "MMM D, YYYY h:mm A";

let ECR_HTMLBody: string = "";
let ECR_Subject: string = "";
let ECR_Recipient: string[] = [];
let ECR_Files: Attachment[] = [];

async function partitionToIndexItem(partition: VSecureFilePartition) {
  const hash = await SHA.hash(partition.contents);
  return VSecureFileIndexItem.decode(
    VSecureFileIndexItem.encode({
      extension: partition.extension,
      hash,
      hashFunction: VCryptoHashFunction.SHA_256,
      name: partition.name,
      sizeInBytes: partition.contents.byteLength,
      type: partition.type,
    }).finish()
  );
}

export interface IDataDecrypted {
  actionEmail: ActionEmail;
  allowForward: boolean;
  drm: VDRM;
  htmlBody?: string;
  styles?: any;
}

export interface IEncryption {
  account: Account;
  dataDecrypted?: IDataDecrypted;
  mailItem?: any;
  onConfirmEncryptClick: () => void;
  onRemoveAttachment?: (item) => Promise<any>;
  onReplaceContentEmail?: (stringToReplace) => Promise<boolean>;
}

export default function Encryption({
  account,
  dataDecrypted,
  mailItem,
  onConfirmEncryptClick,
  onRemoveAttachment,
  onReplaceContentEmail,
}: IEncryption) {
  // status
  const { fetch } = useController();

  const { accounts } = useAccounts();
  const { login } = useAuth();
  const keys = useKeys();

  const [position] = useState<GeolocationPosition | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);
  const [isSwitchMode, setIsSwitchMode] = useState(false);
  const [isConfirmClicked, setIsConfirmClicked] = useState(false);

  const [flagForContent, setFlagForContent] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isCloseConfirmDialog, setIsCloseConfirmDialog] = useState(false);

  let tempCompletedFilesBytes: any;
  let templateEB: any;

  const extension = VExt;
  const m = moment();
  let fileName = "";
  let isError = false;

  const {
    allowForward,
    allowCopy,
    allowPrint,
    allowSave,
    countries,
    dialog,
    error,
    setAllowForward,
    setAllowCopy,
    setAllowPrint,
    setAllowSave,
    setCompletedFilesBytes,
    setCountries,
    setDialog,
    setEnableDecryptReceipts,
    setError,
    setSubmitting,
    setSunrise,
    setSunset,
    setTemplateEB,
    submitting,
    sunrise,
    sunset,
  } = useContext(Context);

  useEffect(() => {
    sentStatus && setDialog(null);
  }, [sentStatus]);

  useEffect(() => {
    const drmEnabled = !!account?.licensing?.drmEnabled;
    const geofencingEnabled = !!account?.licensing?.geofencingEnabled;
    const readReceiptsEnabled = !!account?.licensing?.decryptReceiptNotificationsEnabled;

    if (!drmEnabled) {
      setAllowForward(true);
      setAllowCopy(true);
      setAllowPrint(true);
      setAllowSave(true);
      setSunrise(null);
      setSunset(null);
    }

    if (dataDecrypted !== null) {
      setAllowForward(dataDecrypted.allowForward);
      setAllowCopy(dataDecrypted.drm.allowCopy);
      setAllowPrint(dataDecrypted.drm.allowPrint);
      setAllowSave(dataDecrypted.drm.allowSave);

      ECR_HTMLBody = dataDecrypted.htmlBody;
    }

    if (!geofencingEnabled) {
      setCountries([]);
    }
    if (!readReceiptsEnabled) {
      setEnableDecryptReceipts(false);
    }
  }, [account]);

  useEffect(() => {
    setIsSwitchMode(true);
  }, [dataDecrypted?.actionEmail]);

  const onCancelClick = () => {
    setDialog("confirm-cancel");
  };

  const encrypt = async () => {
    // We have everything but GPS, get location
    try {
      setSubmitting(true);

      const startResponse = await fetch(startEncryption, { keys });
      if (startResponse.response?.code !== VResponseCode.SUCCESS) {
        throw new Error(startResponse.response?.text);
      }
      if (!startResponse.serverSeed) {
        throw new Error("Invalid server response");
      }

      const serverKey = await AES.importKey(startResponse.serverSeed.seed);

      const fileKey = await AES.generateEncryptDecryptKeys();
      const jwk = await AES.exportKey(fileKey);
      const fileKeyBytes: Uint8Array = decode(jwk.k);
      const fileIV = await AES.createIV();

      const encryptedFileKeyBytes = await AES.encrypt(serverKey, startResponse.serverSeed.iv, fileKeyBytes);
      const encryptedFileIV = await AES.encrypt(serverKey, startResponse.serverSeed.iv, fileIV);

      let filePartitions: VSecureFilePartition[] = [];

      if (dataDecrypted === null || dataDecrypted.actionEmail === "forward" || dataDecrypted.actionEmail == "reply") {
        filePartitions = await Promise.all(
          ECR_Files.map(async (file: Attachment) => {
            const [extension] = file.name.split(".").reverse();
            const name = file.name;
            const contents = new Uint8Array(VConvertBase64StringToArrayBuffer(file.content));
            return VSecureFilePartition.decode(
              VSecureFilePartition.encode({
                contents,
                extension,
                name,
                type: VSecureFilePartitionType.DOCUMENT,
              }).finish()
            );
          })
        );
      }

      const htmlBodyPartitions: VSecureFilePartition[] =
        ECR_HTMLBody.length > 0
          ? [
              VSecureFilePartition.decode(
                VSecureFilePartition.encode({
                  contents: new TextEncoder().encode(ECR_HTMLBody),
                  name: "message.html",
                  type: VSecureFilePartitionType.HTML,
                  extension: ".html",
                }).finish()
              ),
            ]
          : [];

      const partitions = filePartitions.concat(htmlBodyPartitions);
      const securePartitions: Uint8Array[] = await Promise.all(
        partitions.map((partition) => AES.encrypt(fileKey, fileIV, VSecureFilePartition.encode(partition).finish()))
      );

      const indexBytes = VSecureFileIndex.encode({
        preferredItemIndex: 0,
        items: await Promise.all(partitions.map(partitionToIndexItem)),
      }).finish();

      const secureFilesList = VSecureFileIndex.decode(
        VSecureFileIndex.encode({
          preferredItemIndex: 0,
          items: await Promise.all(
            partitions.filter((p) => p.type === VSecureFilePartitionType.DOCUMENT).map(partitionToIndexItem)
          ),
        }).finish()
      );

      const indexHash = await AES.encrypt(fileKey, fileIV, indexBytes);

      const fileBytes = VSecureFile.encode({
        header: VSecureFileHeader.decode(
          VSecureFileHeader.encode({
            description: ECR_Subject,
            fileId: startResponse.fileId,
            endpointUrl: "",
            hashFunction: VCryptoHashFunction.SHA_256,
            seed: encryptedFileKeyBytes,
            seedIv: encryptedFileIV,
            version: "1.0",
          }).finish()
        ),
        index: indexHash,
        partitions: securePartitions,
      }).finish();

      const textEncoder = new TextEncoder();
      const prefixBytes = textEncoder.encode(VExt.toUpperCase());
      tempCompletedFilesBytes = VConcatArrays(prefixBytes, fileBytes);
      setCompletedFilesBytes(tempCompletedFilesBytes);

      const hash = await SHA.hash(fileBytes);

      let authorizedUsers = ECR_Recipient;

      // Because the new flow of outlook add-in for mac is prevent but the API receive the value negative of prevent -> this section is reset DRMs
      const preventCopy = !allowCopy;
      const preventForward = !allowForward;
      const preventPrint = !allowPrint;
      const preventSave = !allowSave;

      fileName = `${kebabCase(ECR_Subject).substring(0, 20)}-${m.format("MMDDYY-HHmmss")}.${extension}`;

      const finishResponse = await fetch(finishEncryption, {
        allowCopy: preventCopy,
        allowForward: preventForward,
        allowPrint: preventPrint,
        allowSave: preventSave,
        authorizedUsers,
        countries: countries,
        enableDecryptReceipts: false,
        fileId: startResponse.fileId,
        fileName,
        hash,
        keys,
        latitude: position?.coords.latitude.toString(),
        longitude: position?.coords.longitude.toString(),
        multifactorGeolocation: false,
        notesIncluded: false,
        secureFiles: secureFilesList,
        sunriseDate: sunrise ? moment(sunrise).toDate() : undefined,
        sunsetDate: sunset ? moment(sunset).toDate() : undefined,
        totalSizeInBytes: fileBytes.length,
      });

      if (finishResponse.response?.code !== VResponseCode.SUCCESS) {
        setSuccess(false);
        throw new Error(finishResponse.response?.text);
      } else {
        setSuccess(true);
        await onRemoveAttachment(mailItem).then(async (data: boolean) => {
          if (data) {
            const templateResponse = await fetch(template, {
              fileId: startResponse.fileId,
            });

            templateResponse.text().then(async (templateToReplace) => {
              templateEB = templateToReplace;
              setTemplateEB(templateToReplace);

              await getNewsMessageDraft(process_get_add_attachment_to_draft_for_sendmail);
            });
          }
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setSubmitting(false);
        setDialog("confirm-cancel");
        processError(err?.message);
      }
      return;
    }
  };

  const validTimeline = (sunrise: Date, sunset: Date) => {
    const currentDateTime = new Date();
    currentDateTime.setSeconds(0, 0);

    sunrise?.setSeconds(0, 0);
    sunset?.setSeconds(0, 0);
    if (sunrise !== null && sunset !== null) {
      if (sunrise < currentDateTime || (sunrise < currentDateTime && sunset < currentDateTime)) {
        processError(strings.sunriseInPast);
        return false;
      } else if (sunset < currentDateTime) {
        processError(strings.sunsetInPast);
        return false;
      } else if (sunrise >= sunset) {
        processError(strings.setSunsetAfterSunrise);
        return false;
      }
    } else if (sunrise !== null) {
      if (sunrise < currentDateTime) {
        processError(strings.sunriseInPast);
        return false;
      }
    } else if (sunset !== null) {
      if (sunset < currentDateTime) {
        processError(strings.sunsetInPast);
        return false;
      }
    }
    return true;
  };

  async function getAllDataBeforeEncrypt() {
    await VOJS_Get_Subject(mailItem)
      .then(async (data) => {
        if (data == "" || data == null) {
          processError("Invalid subject of email!");
        } else {
          // Set value of Subject
          ECR_Subject = data;
          validTimeline(sunrise, sunset);
          // Get Receipient
          await VOJS_Get_Recipient(mailItem)
            .then(async (data) => {
              if (data.length == 0) {
                processError("Invalid recipients!");
              } else {
                ECR_Recipient = data;

                // Get HTML Body
                await VOJS_Get_HTMLBody(mailItem)
                  .then(async (data) => {
                    if (data == "" || data == null) {
                      processError("Invalid content of email!");
                    } else {
                      // Set value of HTML Body
                      ECR_HTMLBody = VReplaceCommentHTML(data);

                      // Get Attachment
                      let totalSize = 1000;
                      await VOJS_Get_Attachments(mailItem)
                        .then(async (data) => {
                          if (data) {
                            data.map((file) => {
                              totalSize += VSizeBase64String(file.content);
                            });

                            if (totalSize > 25000000) {
                              processError(strings.largeSizeAttachment);
                            } else {
                              ECR_Files = data;
                            }
                          }
                        })
                        .catch((error) => processError(error?.message));
                    }
                  })
                  .catch((error) => processError(error?.message));
              }
            })
            .catch((error) => processError(error?.message));
        }
      })
      .catch((error) => processError(error?.message));
  }

  const processError = (errorMessage: string) => {
    setIsConfirmClicked(false);
    setFlagForContent(false);
    setIsEncrypted(false);
    setDialog("confirm-cancel");
    setError(new Error(errorMessage));
  };

  const onFinalize = useCallback(async () => {
    setSubmitting(true);

    setIsConfirmClicked(true);

    await delay(5000).then(async () => {
      await getAllDataBeforeEncrypt().then(async () => {
        if (!isError) {
          const mCheckAccountExpired = VCheckIsExpired(account);

          // If access Token not exist or the expired -> refresh token

          // Else set value for AuthResource.accessToken

          AuthResource.accessToken = mCheckAccountExpired.isExpired
            ? (await login(account.email, account.password)).accessToken
            : mCheckAccountExpired.authDefault[0].accessToken;

          setSubmitting(false);

          if (validTimeline(sunrise, sunset)) {
            if (ECR_Subject && ECR_Recipient.length > 0) {
              setFlagForContent(true);

              await encrypt();
            } else processError("Missing some values!");
          }
        }
      });
    });
  }, [account, encrypt, login]);

  const [checked, setChecked] = useState(dataDecrypted?.actionEmail !== null ? true : false);

  const onChangeStatus = () => {
    setChecked(!checked);
  };

  async function sendEmail() {
    try {
      mailItem?.saveAsync(function callback(result) {});
      await delay(3000).then(async () => {
        await getNewsMessageDraft(process_get_news_message_draft_for_sendemail);
      });
    } catch (error) {
      setDialog("confirm-cancel");
      processError(error?.toString());
    }
  }

  async function process_get_news_message_draft_for_sendemail(result: any) {
    try {
      if (result.value[0].id == undefined || result.value[0].id == null || result.value[0].id == "") {
        processError(strings.canNotSendNowPleaseTryAgain);
        return;
      } else {
        const bodyPreview = result.value[0].bodyPreview;
        const checkHasTemplate = bodyPreview?.includes(strings.secureVaultNotification) ? true : false;
        const checkHasAttachment = result.value[0].hasAttachments;

        if (checkHasTemplate && checkHasAttachment) {
          let messageDraftID = result.value[0].id;

          await sendMessagesHasId(process_send_email, messageDraftID);
        } else {
          if (!checkHasAttachment) {
            await process_get_add_attachment_to_draft_for_sendmail(result);
          } else {
            await handleCallbackAddAttachment(result);
          }
        }
      }
    } catch (error) {
      processError(error?.toString());
    }
  }

  async function process_get_add_attachment_to_draft_for_sendmail(result: any) {
    let messageDraftID = result.value[0].id;
    const attachmentData = {
      fileName: fileName,
      dataAttachment: encode(tempCompletedFilesBytes),
      messageId: messageDraftID,
    };
    await addAttachmentToEmail(handleCallbackAddAttachment, JSON.stringify(attachmentData));
  }

  async function process_send_email(result: any) {
    setSentStatus(result?.message == "OK");
    setSubmitting(false);
    mailItem?.close();
    localStorage.removeItem(strings.isEncrypted);
  }

  async function handleCallbackAddAttachment(result: Object) {
    await onReplaceContentEmail(templateEB)
      .then(async (data) => {
        setIsEncrypted(true);
        await delay(10000).then(() => {
          sendEmail();
        });
      })
      .catch((err) => {
        throw new Error("Replace template email error!");
      });
  }

  function renderConfirmAndSendDialog() {
    return (
      <ConfirmModal
        confirmButton={submitting ? <LoadingSpinner size="sm" /> : strings.btnConfirmAndSend}
        content={flagForContent ? renderOverlay() : renderContentOfConfirmDialog()}
        header="Review Settings"
        modalType="confirm"
        onCancel={onCancelClick}
        onConfirm={onFinalize}
        show={dialog === "confirm-encrypt"}
      />
    );
  }

  const onCloseDialog = useCallback(() => {
    setIsCloseConfirmDialog(true);
    setDialog(null);
    mailItem?.close();
  }, []);

  function renderSuccessDialog(messages) {
    return (
      <ConfirmModal
        content={messages}
        confirmButton="Okay"
        header="Success"
        modalType="success"
        onConfirm={onCloseDialog}
        show={!isCloseConfirmDialog}
      />
    );
  }

  function renderLoading() {
    return <LoadingSpinner page="confirm" />;
  }

  const renderContentOfConfirmDialog = (): JSX.Element => {
    return (
      <div>
        <div className={classNames(styles.borderBottom)}>
          <h5>{strings.pageSecureTabHowTitle}</h5>
          <How allowForward={allowForward} allowCopy={allowCopy} allowPrint={allowPrint} allowSave={allowSave} />
        </div>
        <div className={classNames(styles.borderBottom)}>
          <h5 className={styles.titlePermission}>{strings.pageSecureTabWhenTitle}</h5>
          <div className={classNames(styles.section, styles.listItem, styles.gridContainer)}>
            <div className={classNames(styles.listItemText, styles.secondary, styles.marginRight3px)}>
              {sunrise ? moment(sunrise).format(DateTimeFormat) : "now"}
            </div>
            <div className={classNames(styles.listItemText, styles.secondary, styles.autoWidth)}>-</div>
            <div className={classNames(styles.listItemText, styles.secondary, styles.marginLeft3px)}>
              {sunset ? moment(sunset).format(DateTimeFormat) : "forever"}
            </div>
          </div>
        </div>
        <div className={classNames(styles.borderBottom)}>
          <h5 className={styles.titlePermission}>{strings.pageSecureTabWhereTitle}</h5>
          <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={renderLoading}>
            <Where blocked={countries} />
          </AsyncBoundary>
        </div>
      </div>
    );
  };

  function renderOverlay() {
    const vault_svg: any = Vault;
    const vault_wheel: any = VaultWheel;

    return (
      <div className={styles.overlay}>
        <div className={styles.loadingSpinnerContainer}>
          <img className={styles.vault} src={vault_svg} alt="loading" />
          <img
            className={classNames(styles.vaultWheel, {
              [styles.submitting]: !success,
            })}
            src={vault_wheel}
            alt="loading"
          />
        </div>
        <span className={styles.loadingText}>
          {isEncrypted ? (
            strings.modalSending
          ) : success ? (
            <>
              <FontAwesomeIcon className={styles.successIcon} icon={faCircleCheck} /> {strings.modalFileSecured}
            </>
          ) : (
            strings.modalPleaseWaitSecure
          )}
        </span>
      </div>
    );
  }

  const onHideError = useCallback(() => {
    setError(null);
    if (isConfirmClicked) window.location.reload();
  }, [isConfirmClicked]);

  return (
    <>
      <div className={styles.swichControl}>
        <div
          id="swichControl"
          className={classNames(
            checked ? styles.borderSwitchControl : styles.withoutBorderSwitchControl,
            dataDecrypted && styles.disabledbutton
          )}
        >
          <div className={classNames("d-flex justify-content-between")}>
            <h5 className="me-1">
              <b>{strings.ebControlProtection}</b>
            </h5>
            <div className={"my-switch " + (checked && "checked")} onClick={onChangeStatus}>
              <div className={"switch-status"}>{checked ? "On" : "Off"}</div>
            </div>
          </div>
        </div>
        {checked && (
          <div className={styles.secureContainer}>
            {dataDecrypted ? (
              <Protections
                account={account}
                styles={dataDecrypted.styles}
                isNewMail={false}
                drms={{
                  allowForward: dataDecrypted.allowForward,
                  drm: {
                    allowCopy: dataDecrypted?.drm.allowCopy,
                    allowPrint: dataDecrypted?.drm.allowPrint,
                    allowSave: dataDecrypted?.drm.allowSave,
                  },
                }}
                onConfirmEncryptClick={onConfirmEncryptClick}
                isSwitchMode={isSwitchMode}
              />
            ) : (
              <Protections
                account={account}
                isNewMail={true}
                onConfirmEncryptClick={onConfirmEncryptClick}
                isSwitchMode={isSwitchMode}
              />
            )}
            {sentStatus && renderSuccessDialog(strings.mailSentSuccessfully)}
            <ErrorModal error={error} onHide={onHideError} />
            {renderConfirmAndSendDialog()}
          </div>
        )}
      </div>
      <div className={classNames(styles.versionText)}>
        <VersionNumber />
      </div>
    </>
  );
}
