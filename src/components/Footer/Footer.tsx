import classNames from "classnames";
import React from "react";
import { Button } from "react-bootstrap";

import strings from "../../strings";
import styles from "./Footer.module.scss";

interface FooterProps {
  onBack: () => void;
  onSave: () => void;
}

export default function Footer({ onBack, onSave }: FooterProps) {
  return (
    <div className={classNames("d-flex justify-content-center")}>
      <Button className={classNames(styles.btnFooterModal, styles.btnCancel, "border border-white")} onClick={onBack}>
        {strings.cancel}
      </Button>
      <Button variant="primary" className={classNames(styles.btnFooterModal, styles.btnSave)} onClick={onSave}>
        {strings.save}
      </Button>
    </div>
  );
}
