import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { faGlobe } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import classNames from "classnames";
import React, { useContext, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import strings from "../../../strings";
import Context from "../Context";
import How, { DRMs } from "../How";
import When from "../When";
import Where from "../Where";
import defaultStyles from "./Protection.module.scss";

import { Account } from "@ebi/hooks";
import { Clock, Sliders } from "../../../assets/index";
import ErrorModal from "../../../components/ErrorModal";

type ProtectName = "how" | "when" | "where" | "receipt";
type AlertModal = "sunrise-after-sunset" | "sunrise-in-past" | "sunset-in-past";

interface IProtectProps {
  icon: any;
  isActive: boolean;
  name: ProtectName;
  onClick: () => void;
  subTitle: string;
  title: string;
  styles: any;
  titleButton: string;
}

function Protect({ icon, isActive, name, onClick, subTitle, title, styles, titleButton }: IProtectProps) {
  const isReceipt = name === "receipt";

  const { enableDecryptReceipts, setEnableDecryptReceipts } = useContext(Context);

  return (
    <div className={classNames(styles.protectItemPadding)}>
      {isReceipt ? (
        <div className={classNames("d-flex bd-highlight", styles.borderProtect)}>
          <div className={classNames("p-2 w-100 bd-highlight align-items-center", styles.protectItemDisplay)}>
            <div className={classNames(styles.iconDrm)}>
              <FontAwesomeIcon className={styles.icon} icon={icon} />
            </div>

            <div>
              <span className={styles.title}>
                <span>{title}</span>
                <span className={styles.subTitle}>{subTitle}</span>
              </span>
            </div>
          </div>

          <div
            className={classNames(
              "flex-shrink-1 bd-highlight",
              "d-flex align-items-center",
              "form-check",
              "form-switch"
            )}
          >
            <input
              className={classNames("form-check-input", "success", styles.switch)}
              type="checkbox"
              role="switch"
              checked={enableDecryptReceipts}
              onChange={(event) => {
                setEnableDecryptReceipts(event.target.checked);
              }}
            />
          </div>
        </div>
      ) : (
        <div className={classNames("d-flex bd-highlight align-items-center", styles.borderProtect)}>
          <div className={classNames("p-2 w-100 bd-highlight align-items-center", styles.protectItemDisplay)}>
            <div className={classNames(styles.iconDrm)}>
              {name == "how" || name == "when" ? (
                <img className={styles.icon} src={icon}></img>
              ) : (
                <FontAwesomeIcon className={styles.icon} icon={icon} />
              )}
            </div>

            <div>
              <span className={styles.title}>
                <span>{title}</span>
                <span className={styles.subTitle}>{subTitle}</span>
              </span>
            </div>
          </div>

          <button
            key={name}
            className={classNames(styles.protect, { [styles.protectActive]: isActive }, "flex-shrink-1 bd-highlight")}
            type="button"
            onClick={onClick}
          >
            {titleButton}
          </button>
        </div>
      )}
    </div>
  );
}

interface IProtect extends Pick<IProtectProps, "icon" | "name" | "subTitle" | "title" | "titleButton"> {
  renderer: () => React.ReactNode;
  shouldShow?: undefined | (() => boolean | null | undefined);
}

export interface IProtectionsProps {
  account: Account;
  drms?: DRMs;
  isNewMail: boolean;
  isSwitchMode: boolean;
  styles?: any;
  onConfirmEncryptClick: () => void;
}

export default function Protections({
  account,
  drms,
  isNewMail,
  isSwitchMode,
  styles: stylesProp,
  onConfirmEncryptClick,
}: IProtectionsProps) {
  const styles = stylesProp || defaultStyles;
  const {
    allowCopy,
    allowForward,
    allowPrint,
    allowSave,
    countries,
    sunrise,
    sunset,
    setAllowForward,
    setAllowCopy,
    setAllowPrint,
    setAllowSave,
    setSunrise,
    setSunset,
    setCountries,
    setEnableDecryptReceipts,
  } = useContext(Context);

  const [selectedProtect, setSelectedProtect] = useState<ProtectName>("receipt");
  const [alertModal, setAlertModal] = useState<AlertModal | null>(null);

  const currentDateTime = new Date();
  currentDateTime.setSeconds(0, 0);

  const onConfirm = () => {
    setAlertModal(null);
  };

  function renderAlertModal(content: string) {
    return <ErrorModal onHide={onConfirm} error={new Error(content)} />;
  }

  useEffect(() => {
    if (isSwitchMode) {
      setAllowForward(isNewMail ? false : !drms.allowForward);
      setAllowCopy(isNewMail ? false : !drms.drm.allowCopy);
      setAllowPrint(isNewMail ? false : !drms.drm.allowPrint);
      setAllowSave(isNewMail ? false : !drms.drm.allowSave);

      setSunrise(null);
      setSunset(null);
      setCountries([]);
    }
    setEnableDecryptReceipts(false);
  }, [isSwitchMode]);

  const onGoBack = () => {
    handleHideControl();
    setSelectedProtect("receipt");
  };

  const handleSaveHow = (enableCopy: boolean, enableForward: boolean, enablePrint: boolean, enableSave: boolean) => {
    handleHideControl();
    setAllowCopy(enableCopy);
    setAllowForward(enableForward);
    setAllowPrint(enablePrint);
    setAllowSave(enableSave);
    setSelectedProtect("receipt");
  };

  const handleSaveWhen = (sunrise: Date, sunset: Date) => {
    sunrise?.setSeconds(0, 0);
    sunset?.setSeconds(0, 0);
    if (sunrise !== null && sunset !== null) {
      if (sunrise < currentDateTime || (sunrise < currentDateTime && sunset < currentDateTime))
        setAlertModal("sunrise-in-past");
      else if (sunset < currentDateTime) setAlertModal("sunset-in-past");
      else if (sunrise >= sunset) setAlertModal("sunrise-after-sunset");
      else handleProcessSaveWhen(sunrise, sunset);
    } else if (sunrise !== null) {
      if (sunrise < currentDateTime) setAlertModal("sunrise-in-past");
      else handleProcessSaveWhen(sunrise, sunset);
    } else if (sunset !== null) {
      if (sunset < currentDateTime) setAlertModal("sunset-in-past");
      else handleProcessSaveWhen(sunrise, sunset);
    } else handleProcessSaveWhen(sunrise, sunset);
  };

  const handleHideControl = () => {
    document.getElementById("swichControl").style.display = "block";
    document.getElementById("versionNumber").style.display = "block";
  };

  const handleProcessSaveWhen = (sunrise: Date, sunset: Date) => {
    handleHideControl();
    setSunrise(sunrise);
    setSunset(sunset);
    setSelectedProtect("receipt");
  };

  const handleSaveWhere = (countries: number[]) => {
    handleHideControl();
    setCountries(countries);
    setSelectedProtect("receipt");
  };

  function renderDialogs() {
    switch (alertModal) {
      case "sunrise-after-sunset":
        return renderAlertModal(strings.setSunsetAfterSunrise);
      case "sunrise-in-past":
        return renderAlertModal(strings.sunriseInPast);
      case "sunset-in-past":
        return renderAlertModal(strings.sunsetInPast);
      default:
        return null;
    }
  }

  const protects: IProtect[] = [
    {
      icon: null,
      name: "how",
      renderer: () =>
        isNewMail ? (
          <How isNewMail={isNewMail} onGoBack={onGoBack} onSave={handleSaveHow} />
        ) : (
          <How isNewMail={isNewMail} drms={drms} onGoBack={onGoBack} onSave={handleSaveHow} />
        ),
      shouldShow: () => !!account?.licensing?.drmEnabled,
      subTitle: strings.pageSecureTabHowSubTitle1,
      title: strings.pageSecureTabHowTitle,
      titleButton: allowCopy || allowForward || allowPrint || allowSave ? strings.buttonEdit : strings.buttonConfigure,
    },
    {
      icon: null,
      name: "when",
      renderer: () => (
        <When styles={!isNewMail && stylesProp != null ? styles : null} onGoBack={onGoBack} onSave={handleSaveWhen} />
      ),
      shouldShow: () => !!account?.licensing?.drmEnabled,
      subTitle: strings.pageSecureTabWhenSubTitle,
      title: strings.pageSecureTabWhenTitle,
      titleButton: sunrise || sunset ? strings.buttonEdit : strings.buttonConfigure,
    },
    {
      icon: faGlobe as IconProp,
      name: "where",
      renderer: () => (
        <Where styles={!isNewMail && stylesProp != null ? styles : null} onGoBack={onGoBack} onSave={handleSaveWhere} />
      ),
      shouldShow: () => !!account?.licensing?.drmEnabled,
      subTitle: strings.pageSecureTabWhereSubTitle,
      title: strings.pageSecureTabWhereTitle,
      titleButton: countries.length > 0 ? strings.buttonEdit : strings.buttonConfigure,
    },
    {
      icon: faUserCheck,
      name: "receipt",
      renderer: () => <></>,
      shouldShow: () => !!account?.licensing?.drmEnabled,
      subTitle: strings.pageSecureTabReceiptSubTitle,
      title: strings.pageSecureTabReceiptTitle,
      titleButton: "",
    },
  ];

  function renderProtects() {
    const visibleProtects = protects.filter((protect) => protect.shouldShow === undefined || !!protect.shouldShow());
    return (
      <div className={styles.protects}>
        {visibleProtects.map((protect) => (
          <Protect
            key={protect.name}
            icon={protect.icon ? protect.icon : protect.name == "how" ? Sliders : Clock}
            isActive={protect.name === selectedProtect}
            name={protect.name}
            onClick={() => {
              document.getElementById("swichControl").style.display = "none";
              document.getElementById("versionNumber").style.display = "none";
              setSelectedProtect(protect.name);
            }}
            subTitle={protect.subTitle}
            title={protect.title}
            styles={styles}
            titleButton={protect.titleButton}
          />
        ))}

        <div className={"d-flex justify-content-center"}>
          <Button className={classNames(styles.buttonReview)} variant="primary" onClick={onConfirmEncryptClick}>
            {strings.buttonReview}
          </Button>
        </div>
      </div>
    );
  }

  function renderProtect() {
    const protect = protects.find((t) => t.name === selectedProtect);
    return (
      <div className={styles.protectItem} key={protect.name}>
        {protect?.renderer()}
      </div>
    );
  }

  return (
    <>
      <div className={styles.protectsContainer}>
        {selectedProtect === "receipt" ? renderProtects() : renderProtect()}
      </div>

      {renderDialogs()}
    </>
  );
}
