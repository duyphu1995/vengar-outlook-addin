import { VDRM, VSecureFileIndex, VSecureFilePartition, VSecureFilePartitionType } from "@ebi/protobuffers";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Modal } from "react-bootstrap";

import { revoke, shred } from "@ebi/api-client";
import { AES } from "@ebi/cryptography";
import { useAccounts, useKeys } from "@ebi/hooks";
import classNames from "classnames";
import { saveAs } from "file-saver";
import FTIcon from "react-file-type-icons";
import { useController } from "rest-hooks";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import strings from "../../strings";
import styles from "./Container.module.scss";

import { VColoredString, VFormatTimeForDecrypt, VRenderDRMTooltips } from "../../ultils/VUltils";
import { Forward, LogoWithText, Reply, ReplyAll, Revoke, Shred } from "../../assets/index";
import DocumentViewer from "../../components/DocumentViewer";
import moment, { Moment } from "moment";
import Counter from "../../components/Counter";
import ErrorModal from "../../components/ErrorModal";

type DialogDecrypt = "confirm-revoke" | "confirm-shred" | "revoke-success" | "shred-success" | "information-feature";
const defaultAccount = localStorage.getItem("default-account");

interface IHtmlNoteProps {
  note: string;
}
function HtmlNote({ note }: IHtmlNoteProps) {
  const [element, setElement] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (element === null) {
      return;
    }
    const iframe = element.contentWindow && element.contentWindow;
    if (!iframe) return;

    const iframeDoc = iframe.document;
    iframeDoc.open();
    iframeDoc.write(note);
    iframeDoc.close();
    iframeDoc.onselectstart = (event) => {
      event.preventDefault();
    };
  }, [element, note]);

  return (
    <iframe
      ref={setElement}
      sandbox="allow-same-origin"
      className={styles.iframe}
      title="Email message contents"
      allow="clipboard-read"
    />
  );
}

interface IContainerProps {
  author: string;
  authorizedUsers: string[];
  subject: string;
  drmForward: boolean;
  drm: VDRM | null | undefined;
  fileId: string;
  fileIV: Uint8Array;
  fileName: string;
  fileSeed: Uint8Array;
  index: VSecureFileIndex;
  partitions: Uint8Array[];
  sunrise: Date | null;
  sunset: Date | null;
}

export default function Container({
  author,
  authorizedUsers,
  subject,
  drmForward,
  drm,
  fileId,
  fileIV,
  fileSeed,
  index,
  partitions,
  sunrise,
  sunset,
}: IContainerProps) {
  const keys = useKeys();
  const { fetch } = useController();
  const { accounts } = useAccounts();

  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [notes, setNotes] = useState<string[] | null>(null);
  const [openPartitionError, setOpenPartitionError] = useState<Error | null>(null);
  const [openPartitionIndex, setOpenPartitionIndex] = useState<number | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  const currentAccount = accounts?.find((a) => a.email === defaultAccount);

  const isAuthor = author.toLowerCase() === currentAccount?.email.toLowerCase();
  const usersWithoutAuthor = authorizedUsers.filter((u) => u !== author && u != "");

  const [dialogDecrypt, setDialogDecrypt] = useState<DialogDecrypt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [timeSentForDecrypt, setTimeSentForDecrypt] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    getInforOfEmail();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }
    const handler = (e: MouseEvent) => {
      e.preventDefault();
    };
    element.addEventListener("contextmenu", handler);
    return () => {
      element.removeEventListener("contextmenu", handler);
    };
  }, [element]);

  const decryptPartition = useCallback(
    async (partitionIndex: number) => {
      const fileKey = await AES.importKey(fileSeed);
      const encryptedPartition = partitions[partitionIndex];
      const partitionBytes = await AES.decrypt(fileKey, fileIV, encryptedPartition);
      return VSecureFilePartition.decode(partitionBytes);
    },
    [fileIV, fileSeed, partitions]
  );

  useEffect(() => {
    if (notes) {
      return;
    }
    (async () => {
      const fileKey = await AES.importKey(fileSeed);
      const indexes = index.items.reduce((acc, item, i) => {
        if ([VSecureFilePartitionType.HTML, VSecureFilePartitionType.NOTES].includes(item.type)) {
          return acc.concat([i]);
        }
        return acc;
      }, [] as number[]);
      const encryptedPartitions = indexes.map((i) => partitions[i]);
      const partitionBytes = await Promise.all(
        encryptedPartitions.map((encryptedPartition) => AES.decrypt(fileKey, fileIV, encryptedPartition))
      );
      const textDecoder = new TextDecoder("utf-8");
      const decodedPartitions = partitionBytes
        .map((bytes) => VSecureFilePartition.decode(bytes))
        .map((partition) => textDecoder.decode(partition.contents));
      setNotes(decodedPartitions);
    })();
  }, [fileIV, fileSeed, index, notes, partitions]);

  useEffect(() => {
    if (openPartitionIndex === null) {
      return;
    }
    if (fileData) {
      return;
    }
    (async () => {
      const partition = await decryptPartition(openPartitionIndex);
      setFileData(partition.contents);
    })();
  }, [decryptPartition, fileData, index, openPartitionIndex]);

  const onCloseDialog = useCallback(() => {
    setDialogDecrypt(null);
  }, []);

  const onRevokeClick = useCallback(async () => {
    if (isAuthor) {
      setDialogDecrypt("confirm-revoke");
    }
  }, []);

  const onRevoke = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(revoke, {
        fileId,
        keys,
      });
      console.log(response);

      setSubmitting(false);
      setDialogDecrypt("revoke-success");
    } catch (e: unknown) {
      setSubmitting(false);
      if (e instanceof Error) {
        setError(e);
      }
    }
  }, [fetch, fileId, keys]);

  const onShredClick = useCallback(() => {
    if (isAuthor) {
      setDialogDecrypt("confirm-shred");
    }
  }, []);

  const onShred = useCallback(async () => {
    setSubmitting(true);

    try {
      const response = await fetch(shred, {
        fileId,
        keys,
      });
      console.log(response);

      setSubmitting(false);
      setDialogDecrypt("shred-success");
    } catch (e: unknown) {
      setSubmitting(false);
      if (e instanceof Error) {
        setError(e);
      }
    }
  }, [fetch, fileId, keys]);

  const onConfirmShredSuccess = useCallback(() => {
    Office.context.ui.messageParent(strings.closeDialog);
  }, []);

  const onFileClick = useCallback(
    async (i: number) => {
      if (drm?.allowSave || author === currentAccount?.email) {
        const partition = await decryptPartition(i);
        const itemIndex = index.items[i];
        const blob = new Blob([partition.contents]);
        saveAs(blob, itemIndex.name);
      } else {
        setOpenPartitionIndex(i);
      }
    },
    [currentAccount?.email, author, decryptPartition, drm?.allowSave, index.items]
  );

  const onOpenPartitionClose = useCallback(() => {
    setFileData(null);
    setOpenPartitionError(null);
    setOpenPartitionIndex(null);
  }, []);

  function renderFiles() {
    return index.items.map((file, i) => {
      if (file.type !== VSecureFilePartitionType.DOCUMENT) {
        return null;
      }
      return (
        <Button variant="link" key={i} style={{ marginBottom: 3 }} onClick={() => onFileClick(i)}>
          <FTIcon fileName={file.name} /> {file.name}
          {i < index.items.length - 1 ? "; " : null}
        </Button>
      );
    });
  }

  function renderConfirmRevoke() {
    return (
      <ConfirmModal
        cancelButton="No"
        confirmButton={submitting ? <LoadingSpinner size="sm" /> : "Yes"}
        content={
          <div>
            {strings.revokeContent1} <br />
            <br /> {strings.revokeContent2}{" "}
          </div>
        }
        header="Confirmation"
        modalType="confirm"
        onCancel={onCloseDialog}
        onConfirm={onRevoke}
        show
      />
    );
  }

  function renderConfirmModal(content: string) {
    return (
      <ConfirmModal
        confirmButton="Okay"
        content={content}
        header="Information"
        modalType="confirm"
        onConfirm={onCloseDialog}
        show
      />
    );
  }

  function renderConfirmShred() {
    return (
      <ConfirmModal
        cancelButton="Cancel"
        confirmButton={submitting ? <LoadingSpinner size="sm" /> : "Yes, Shred"}
        content={
          <div className={styles.contentConfirmModal}>
            {VColoredString(strings.shredContent1, ["permanently", "NOT"], "F0395A")}
            {<p>{strings.shredContent2}</p>}
          </div>
        }
        header="Confirmation"
        modalType="shred"
        onCancel={onCloseDialog}
        onConfirm={onShred}
        show
      />
    );
  }

  function renderBtnReplyForward() {
    interface IBtnReplyForward {
      title: string;
      icon: any;
      disable: boolean;
      hidden: boolean;
      style: any;
      // onClick?: () => void;
    }

    const btnReplyForwards: IBtnReplyForward[] = [
      {
        title: "Reply",
        icon: Reply,
        disable: false,
        hidden: false,
        style: { marginRight: 2 },
        // onClick: onReplyEmail,
      },
      {
        title: "Reply All",
        icon: ReplyAll,
        disable: usersWithoutAuthor.length < 2,
        hidden: false,
        style: { marginRight: 2 },
        // onClick: onReplyAllEmail,
      },
      {
        title: "Forward",
        icon: Forward,
        disable: !isAuthor && !drmForward,
        hidden: false,
        style: { marginRight: 0 },
        // onClick: onForwardEmail,
      },
    ];

    return (
      <div>
        {btnReplyForwards.map((button, i) => (
          <Button
            key={i}
            style={button.style}
            // onClick={button.onClick}
            disabled={button.disable}
            hidden={button.hidden}
            className={classNames(styles.btnReplyAndForward)}
          >
            <img className={classNames(styles.iconBtn)} src={button.icon} />
            {button.title}
          </Button>
        ))}
      </div>
    );
  }

  interface ISuccessModal {
    message: string;
    onConfirm: () => void;
  }
  function renderSuccessModal(props: ISuccessModal) {
    return (
      <ConfirmModal
        confirmButton="Okay"
        content={props.message}
        header="Success"
        modalType="success"
        onConfirm={props.onConfirm}
        show
      />
    );
  }

  function renderRevokeSuccess() {
    return renderSuccessModal({ message: strings.revokeSuccessful, onConfirm: onCloseDialog });
  }

  function renderShredSuccess() {
    return renderSuccessModal({ message: strings.shredSuccessful, onConfirm: onConfirmShredSuccess });
  }

  function renderDialogs() {
    switch (dialogDecrypt) {
      case "confirm-revoke":
        return renderConfirmRevoke();
      case "confirm-shred":
        return renderConfirmShred();
      case "revoke-success":
        return renderRevokeSuccess();
      case "shred-success":
        return renderShredSuccess();
      case "information-feature":
        return renderConfirmModal(strings.availableInNextVersion);
      default:
        return null;
    }
  }

  function renderNotes() {
    if (!notes) {
      return <LoadingSpinner />;
    }
    return notes.map((note, i) => <HtmlNote key={i} note={note} />);
  }

  function renderOpenPartition() {
    if (!fileData) {
      return null;
    }

    const show = openPartitionIndex !== null;
    const indexItem = openPartitionIndex !== null ? index.items[openPartitionIndex] : null;

    if (!indexItem) {
      return;
    }

    return (
      <Modal
        dialogClassName={styles.docViewerModal}
        contentClassName={styles.docViewerModal}
        size="xl"
        show={show}
        onHide={onOpenPartitionClose}
      >
        <Modal.Header closeButton>{indexItem?.name}</Modal.Header>

        <Modal.Body ref={setElement} style={{ overflow: "hidden" }}>
          {openPartitionError ? (
            <Alert variant="danger">Error rendering document: {openPartitionError.message}</Alert>
          ) : (
            <DocumentViewer className={styles.docViewer} fileData={fileData} fileName={indexItem.name} />
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onOpenPartitionClose}>
            {strings.close}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  async function getInforOfEmail() {
    const message = JSON.parse(localStorage.getItem(strings.LS_MAIL_ITEM));
    let updateRecipients = [];
    message.toRecipients.forEach((element) => {
      updateRecipients.push(element.emailAddress.name);
    });
    setRecipients(updateRecipients);
    setTimeSentForDecrypt(VFormatTimeForDecrypt(message.sentDateTime));
    setDisplayName(
      message.from.emailAddress.name != null || message.from.emailAddress.name != ""
        ? message.from.emailAddress.name
        : author
    );
  }

  function hasWhiteSpace(str) {
    return /\s/.test(str);
  }

  function getInitials(inputString) {
    if (hasWhiteSpace(inputString)) {
      const words = inputString.split(" ");
      const selectedWords = words.slice(0, 2);
      const initials = selectedWords.map((word) => word.charAt(0));
      return initials.join("").toUpperCase();
    } else {
      return inputString.substring(0, 2).toUpperCase();
    }
  }

  function renderBtnShredRevoke() {
    const revokeSvg: any = Revoke;
    const shredSvg: any = Shred;
    return (
      <div className="d-flex justify-content-between flex-grow-1">
        <div className="mr-auto">{recipients.join("; ")}</div>
        <div style={{ marginTop: 5 }}>
          <Button
            onClick={onRevokeClick}
            hidden={!(isAuthor && currentAccount?.licensing.recallEnabled)}
            style={{ marginRight: 2, width: 110, height: 35 }}
            className={styles.btn}
          >
            <img className={styles.btnShredAndRevoke} src={revokeSvg} alt="reply" />
            {strings.btnRevoke}
          </Button>
          <Button
            onClick={onShredClick}
            style={{ width: 110, height: 35 }}
            hidden={!(isAuthor && currentAccount?.licensing.shredEnabled)}
            className={styles.btn}
          >
            <img className={styles.btnShredAndRevoke} src={shredSvg} alt="reply" />
            {strings.btnShred}
          </Button>
        </div>
      </div>
    );
  }

  function renderContentEmail() {
    const logoPng: any = LogoWithText;
    return (
      <>
        <Card className={styles.vaultContainer}>
          <Card.Body className={styles.cardBody}>
            <div className={styles.cardHeaderMail}>
              <div className="d-flex flex-row justify-content-between">
                <img style={{ width: 184, height: 25 }} src={logoPng} alt="logo" />
                {renderCounter()}
              </div>
              <Card.Title className="d-flex flex-row justify-content-between">
                <label className={styles.subjectTitle}>{subject || "-"}</label>
                {renderBtnReplyForward()}
              </Card.Title>
              <div className="d-flex flex-row">
                <div className={styles.circleContainer}>
                  <div className={styles.avaText}>{getInitials(displayName)}</div>
                </div>

                <div className="flex-grow-1" style={{ marginLeft: 10, paddingTop: 5 }}>
                  <div className="d-flex justify-content-between">
                    <div className="mr-auto">{displayName}</div>
                    <div>{timeSentForDecrypt}</div>
                  </div>

                  <div className="d-flex flex-row">
                    <div className="pe-4">{strings.pageOpenContainerTo}: </div>
                    {renderBtnShredRevoke()}
                  </div>
                </div>
              </div>
              <Card.Title className="d-flex flex-row justify-content-between" style={{ marginTop: 10 }}>
                <div style={{ flexWrap: "wrap" }}>
                  <div className="pe-4" style={{ fontSize: 14, alignItems: "center", lineHeight: 2.5 }}>
                    {strings.pageOpenContainerAttachments}: {renderFiles()}
                  </div>
                </div>

                <div className={classNames("p-2 text-dark", styles.drm)}>
                  <label className={styles.labelDRM}>DRM:</label>
                  {VRenderDRMTooltips({ drm, drmForward, isAuthor, sunrise, sunset })}
                </div>
              </Card.Title>
            </div>
            <Card.Text className={classNames("bg-light text-dark mt-4 p-4", styles.body)}>{renderNotes()}</Card.Text>
          </Card.Body>
        </Card>
      </>
    );
  }

  function renderCounter() {
    if (sunset != null && !isAuthor) {
      const [isAfter, setIsAfter] = useState(false);
      const [diff, setDiff] = useState(-1);
      const [started, setStarted] = useState<Moment>(null);
      const [diffSeconds, setDiffSeconds] = useState(-1);

      useEffect(() => {
        const intervalId = setInterval(() => {
          const isAfter = moment().isAfter(moment.utc(sunset));
          setIsAfter(isAfter);

          const diff = moment().diff(moment.utc(sunset), "minutes");
          setDiff(diff);
          if (diff == 0 && started == null) {
            setStarted(moment());
          }
        }, 1000);

        return () => clearInterval(intervalId);
      }, []);

      useEffect(() => {
        if (isAfter) {
          Office.context.ui.messageParent(strings.closeDialogEndTime);
        }
      }, [isAfter]);

      useEffect(() => {
        if (started != null && diffSeconds == -1) {
          setDiffSeconds(
            moment
              .duration(started.diff(moment.utc(sunset)))
              .abs()
              .seconds()
          );
        }
      }, [started]);

      return diff == 0 ? (
        <div>
          The dialog will be closed after <Counter timeout={diffSeconds * 1000}></Counter> seconds
        </div>
      ) : (
        <></>
      );
    } else {
      return <></>;
    }
  }

  return (
    <>
      {renderContentEmail()}
      {renderOpenPartition()}
      {renderDialogs()}
    </>
  );
}
