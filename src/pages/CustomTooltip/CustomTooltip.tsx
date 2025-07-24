import React from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import styles from "./CustomTooltip.module.scss";

const CustomTooltip = ({ header, body, children }) => {
  return (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="bottom"
      overlay={
        <Popover id="popover-basic" className={styles.tooltipContent}>
          <Popover.Header as="h3" className={styles.tooltipContentHeader}>
            <div key={header} style={{ marginLeft: 5 }}>
              {header}
            </div>
          </Popover.Header>
          <Popover.Body className={styles.tooltipContentBody}>{body}</Popover.Body>
        </Popover>
      }
    >
      {children}
    </OverlayTrigger>
  );
};

export default CustomTooltip;
