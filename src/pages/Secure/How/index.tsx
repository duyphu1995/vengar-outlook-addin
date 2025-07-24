import { Dispatch, SetStateAction, useCallback, useContext, useState } from "react";

import { VDRM } from "@ebi/protobuffers";
import { faCopy, faSave } from "@fortawesome/free-regular-svg-icons";
import { faPrint } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { Forward } from "../../../assets/index";
import FooterWithBack from "../../../components/Footer/Footer";

import strings from "../../../strings";
import Context from "../Context";
import styles from "./How.module.scss";

export interface DRMs {
  allowForward: boolean;
  drm: VDRM;
}

export interface HowProps {
  isNewMail: boolean;
  drms?: DRMs;
  onGoBack: () => void;
  onSave: (enableCopy: boolean, enableForward: boolean, enablePrint: boolean, enableSave: boolean) => void;
}

export default function How(props: HowProps) {
  const { isNewMail, drms, onGoBack, onSave } = props;
  const { allowForward, allowCopy, allowPrint, allowSave } = useContext(Context);

  const [tempAllowForward, setTempAllowForward] = useState(allowForward);
  const [tempAllowCopy, setTempAllowCopy] = useState(allowCopy);
  const [tempAllowPrint, setTempAllowPrint] = useState(allowPrint);
  const [tempAllowSave, setTempAllowSave] = useState(allowSave);

  const setAllowsForward = useCallback(
    (value) => {
      setTempAllowForward(value);

      if (value) {
        setTempAllowCopy(true);
        setTempAllowPrint(true);
        setTempAllowSave(true);
      }
    },
    [setTempAllowForward, setTempAllowCopy, setTempAllowPrint, setTempAllowSave]
  );

  const setAllowsCopy = useCallback(
    (value) => {
      setTempAllowCopy(value);

      if (value) {
        setTempAllowPrint(true);
        setTempAllowSave(true);
      } else {
        setTempAllowForward(false);
      }
    },
    [setTempAllowForward, setTempAllowCopy, setTempAllowPrint, setTempAllowSave]
  );

  const setAllowsPrint = useCallback(
    (value) => {
      setTempAllowPrint(value);

      if (value) {
        setTempAllowSave(true);
      } else {
        setTempAllowForward(false);
        setTempAllowCopy(false);
      }
    },
    [setTempAllowForward, setTempAllowCopy, setTempAllowPrint, setTempAllowSave]
  );

  const setAllowsSave = useCallback(
    (value) => {
      setTempAllowSave(value);

      if (!value) {
        setTempAllowForward(false);
        setTempAllowCopy(false);
        setTempAllowPrint(false);
      }
    },
    [setTempAllowForward, setTempAllowCopy, setTempAllowPrint, setTempAllowSave]
  );

  const handleSaveHow = () => {
    onSave(tempAllowCopy, tempAllowForward, tempAllowPrint, tempAllowSave);
  };

  const types = [
    {
      description: strings.pageSecureHowForwardDescription,
      name: "forward",
      icon: Forward,
      setter: setAllowsForward,
      title: strings.pageSecureHowForwardLabel,
      value: tempAllowForward,
      valueOrg: !drms?.allowForward,
    },
    {
      description: strings.pageSecureHowCopyDescription,
      name: "copy",
      icon: faCopy,
      setter: setAllowsCopy,
      title: strings.pageSecureHowCopyLabel,
      value: tempAllowCopy,
      valueOrg: !drms?.drm?.allowCopy,
    },
    {
      description: strings.pageSecureHowPrintDescription,
      name: "print",
      icon: faPrint,
      setter: setAllowsPrint,
      title: strings.pageSecureHowPrintLabel,
      value: tempAllowPrint,
      valueOrg: !drms?.drm?.allowPrint,
    },
    {
      description: strings.pageSecureHowSaveDescription,
      name: "save",
      icon: faSave,
      setter: setAllowsSave,
      title: strings.pageSecureHowSaveLabel,
      value: tempAllowSave,
      valueOrg: !drms?.drm?.allowSave,
    },
  ];

  function renderType({
    description,
    name,
    icon,
    setter,
    title,
    value,
    valueOrg,
  }: {
    description: string;
    name: string;
    icon: any;
    setter: Dispatch<SetStateAction<boolean>>;
    title: string;
    value: boolean;
    valueOrg: boolean;
  }) {
    return (
      <div
        key={name}
        className={classNames(styles.drmRow, {
          [styles.drmRowDisabled]: !value,
        })}
      >
        <div className={classNames("d-flex bd-highlight")}>
          <div
            className={classNames("p-2 w-100 bd-highlight align-items-center", styles.protectItemDisplay, styles.how)}
          >
            <div style={{ margin: "0 4px 0 0" }}>
              {name === "forward" ? (
                <img className={styles.icon} src={icon}></img>
              ) : (
                <FontAwesomeIcon className={styles.icon} icon={icon} />
              )}
            </div>

            <div className={styles.titleContainer}>
              <span className={styles.drmTitle}>{title}</span>
              <span className={styles.drmDescription}>{description}</span>
            </div>
          </div>

          <div
            className={classNames(
              "flex-shrink-1 bd-highlight",
              "d-flex align-items-center",
              "form-check",
              "form-switch",
              styles.switchContainer
            )}
          >
            <input
              className={classNames("form-check-input", "success", styles.switch)}
              type="checkbox"
              role="switch"
              disabled={!isNewMail && valueOrg}
              checked={value}
              onChange={(event) => {
                setter(event.target.checked);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.howContainer}>
      <div>
        <div className={classNames(styles.howDRMDecs)}>
          <h5>{strings.pageSecureTabHowSubTitle}</h5>
          <p className={styles.howSubtitle}>{strings.pageSecureHowDescription}</p>
        </div>

        <div className={styles.borderBottom}></div>

        <div className={classNames(styles.howDRM)}>{types.map(renderType)}</div>
      </div>
      <div className={styles.footer}>
        <FooterWithBack onBack={onGoBack} onSave={handleSaveHow} />
      </div>
    </div>
  );
}
