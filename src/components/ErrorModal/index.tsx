import { Button, Modal } from "react-bootstrap";

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faTriangleExclamation } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import classNames from "classnames";
import React from "react";

import strings from "../../strings";
import styles from "./ErrorModal.module.scss";

interface ErrorModalProps {
  children?: React.ReactNode;
  error: Error | null;
  header?: string;
  onHide: () => void;
}

export default function ErrorModal({ children, error, header, onHide }: ErrorModalProps) {
  return (
    <Modal
      backdropClassName={styles.backdrop}
      className={styles.dialog}
      dialogClassName={"modal-dialog-centered"}
      onHide={onHide}
      show={!!error}
    >
      <div className={classNames(styles.header, "d-flex bd-highlight")}>
        <FontAwesomeIcon
          icon={faTriangleExclamation as IconProp}
          className={classNames("p-2 bd-highlight", styles.iconWarning)}
        />

        <Modal.Header className={classNames("p-2 bd-highlight", styles.headerBoderBottom)}>
          <Modal.Title>{header ? header : strings.componentErrorModalTitle}</Modal.Title>
        </Modal.Header>

        <div className={classNames("ms-auto p-2 bd-highlight")} onClick={onHide}>
          <FontAwesomeIcon icon={faClose} className={styles.icon} />
        </div>
      </div>

      <Modal.Body className={styles.borderContent}>
        {children}
        {error?.message}
      </Modal.Body>

      <Modal.Footer className={styles.borderFooter}>
        <div className={classNames("d-flex justify-content-center", styles.footerModal)}>
          <Button variant="primary" className={classNames(styles.btnFooterModal, styles.btnConfirm)} onClick={onHide}>
            {strings.componentErrorModalConfirm}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
ErrorModal.defaultProps = {
  children: null,
};
