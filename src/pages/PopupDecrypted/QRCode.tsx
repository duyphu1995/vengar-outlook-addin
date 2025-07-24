import { useAuth, useQRVerification } from "@ebi/hooks";
import { VQR } from "@ebi/protobuffers";
import { Buffer } from "buffer";
import React from "react";
import { Card } from "react-bootstrap";
import Counter from "../../components/Counter";
import { AccountVerificationTimeout } from "../../consts";

import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { VInitials } from "../../ultils/VUltils";
import { LogoWithText } from "../../assets";
import strings from "../../strings";
import styles from "./QRCode.module.scss";

interface ItemEmail {
  author?: string;
  attachmentName?: string;
  displayName?: string;
  receipients?: string;
  subject?: string;
  timeSent?: string;
}

interface IQRCodeProps {
  isCompose: boolean;
  itemEmail?: ItemEmail;
  onVerified: () => void;
  qr: VQR;
}

const defaultAccount = localStorage.getItem("default-account");
const logoPng: any = LogoWithText;

export default function Container({ isCompose, itemEmail, onVerified, qr }: IQRCodeProps) {
  const { getAccessToken } = useAuth();

  useQRVerification({
    accessToken: getAccessToken(defaultAccount)?.accessToken,
    email: defaultAccount || "",
    onVerified,
    qrId: qr.qrId,
  });

  const data = Buffer.from(qr.qrImage).toString("base64");
  const src = `data:image/png;base64,${data}`;

  return (
    <Card className={styles.vaultContainer}>
      <Card.Body className={styles.cardBody}>
        {!isCompose && (
          <div className={styles.cardHeaderMail}>
            <img style={{ width: 184, height: 25 }} src={logoPng} alt="logo" />
            <Card.Title className="d-flex flex-row justify-content-between">
              <label className={styles.subjectTitle}>{itemEmail.subject || "-"}</label>
            </Card.Title>
            <div className="d-flex flex-row" style={{ marginBottom: 10 }}>
              <div className={styles.circleContainer}>
                <div className={styles.avaText}>
                  {VInitials(
                    itemEmail.displayName != null || itemEmail.displayName !== ""
                      ? itemEmail.displayName
                      : itemEmail.author
                  )}
                </div>
              </div>

              <div className="flex-grow-1" style={{ marginLeft: 10, paddingTop: 5 }}>
                <div className="d-flex justify-content-between">
                  <div className="mr-auto">
                    {itemEmail.displayName != null || itemEmail.displayName !== ""
                      ? itemEmail.displayName
                      : itemEmail.author}
                  </div>
                  <div>{itemEmail.timeSent}</div>
                </div>

                <div className="d-flex flex-row">
                  <div className="pe-4">
                    {strings.pageOpenContainerTo}: {itemEmail.receipients}
                  </div>
                </div>

                <div className="d-flex flex-row">
                  <div className="pe-4">Vault: {itemEmail.attachmentName}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card.Text className={classNames("bg-light text-dark mt-4 p-4", styles.body)}>
          <div className={styles.container}>
            <div className={!isCompose ? styles.qrContainer : styles.qrContainerIsCompose}>
              <h3 className={styles.title}>{strings.pageOpenQRCodeTitle}</h3>
              <br></br>
              <p className={styles.description}>
                You MUST scan the QR Code below using the EB Control app on <br></br>your mobile device using this icon{" "}
                <FontAwesomeIcon icon={faQrcode}></FontAwesomeIcon> to verify your location<br></br>before this
                protected file will be decrypted.
              </p>
              <img src={src} className={styles.qrCode} />
              <div className={styles.qrCountDown}>
                {strings.pageOpenQRCodeCounter} <br></br>
                <b>
                  <Counter timeout={AccountVerificationTimeout} />
                </b>
              </div>
            </div>
          </div>
        </Card.Text>
      </Card.Body>
    </Card>
  );
}
