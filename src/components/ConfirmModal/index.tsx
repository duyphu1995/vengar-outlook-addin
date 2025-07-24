import { Button, Modal } from "react-bootstrap";

import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import styles from "./ConfirmModal.module.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { Form } from "react-bootstrap";

import strings from "../../strings";
import Context from "../../pages/Secure/Context";

export type modalType = "confirm" | "success" | "shred";

interface ConfirmModalProps {
  cancelButton?: React.ReactNode;
  confirmButton?: React.ReactNode;
  content?: React.ReactNode;
  header: React.ReactNode;
  modalType: modalType;
  onCancel?: () => void;
  onConfirm: () => void;
  show: boolean;
}

export default function ConfirmModal({
  cancelButton,
  confirmButton,
  content,
  header,
  modalType,
  onCancel,
  onConfirm,
  show,
}: ConfirmModalProps) {
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState(null);

  const { submitting } = useContext(Context);

  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      (ref.current as HTMLInputElement).focus();
    }
  }, []);

  const onSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setErrors(null);
      setSearch(event.target.value);
    },
    [setSearch]
  );

  return (
    <Modal
      show={show}
      className={styles.dialog}
      backdropClassName={styles.backdrop}
      dialogClassName={"modal-dialog-centered"}
    >
      <div
        className={classNames(
          modalType == "confirm" ? styles.header : modalType == "success" ? styles.headerSuccess : styles.headerShred,
          "d-flex flex-row justify-content-between"
        )}
      >
        <Modal.Header className={styles.headerBoderBottom}>
          <Modal.Title>{header}</Modal.Title>
        </Modal.Header>

        <div className={classNames(submitting && styles.closeIconDisable)} onClick={onCancel ? onCancel : onConfirm}>
          <FontAwesomeIcon icon={faClose} className={classNames(styles.icon)} />
        </div>
      </div>

      <Modal.Body
        className={
          modalType == "confirm"
            ? styles.borderContent
            : modalType == "success"
            ? styles.borderContentSuccess
            : styles.borderContentShred
        }
      >
        {content}
        {modalType === "shred" ? (
          <>
            <Form.Control
              type="text"
              className={classNames(styles.inputShred)}
              placeholder={`Type the word "SHRED"`}
              value={search}
              isInvalid={!!errors}
              onChange={onSearchChange}
            />
            <Form.Control.Feedback type="invalid">{errors}</Form.Control.Feedback>
          </>
        ) : null}
      </Modal.Body>

      <Modal.Footer
        className={
          modalType == "confirm"
            ? styles.borderFooter
            : modalType == "success"
            ? styles.borderFooterSuccess
            : styles.borderFooterShred
        }
      >
        <div className={classNames("d-flex justify-content-center", styles.footerModal)}>
          {onCancel && (
            <Button
              className={classNames(styles.btnFooterModal, styles.btnCancel, "border border-white")}
              onClick={onCancel}
              disabled={submitting}
            >
              {cancelButton}
            </Button>
          )}
          <Button
            variant="primary"
            disabled={submitting}
            className={classNames(
              styles.btnFooterModal,
              modalType == "confirm"
                ? styles.btnConfirm
                : modalType == "success"
                ? styles.btnConfirmSuccess
                : styles.btnConfirmShred
            )}
            onClick={
              modalType == "shred"
                ? () => {
                    const isValid = search === "SHRED";
                    if (isValid) {
                      setErrors(null);
                      onConfirm();
                    } else {
                      setErrors(strings.componentShredDesc);
                    }
                  }
                : onConfirm
            }
          >
            {confirmButton}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
ConfirmModal.defaultProps = {
  cancelButton: strings.cancel,
  confirmButton: strings.componentErrorModalConfirm,
  content: "",
  header: "",
};
