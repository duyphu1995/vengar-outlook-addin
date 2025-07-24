import { faQuestionCircle, faUserCircle } from "@fortawesome/free-regular-svg-icons";
import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import { Dropdown } from "react-bootstrap";
import { LogoWithText } from "../../assets/index";
import { AccountPath, SupportUrl } from "../../consts";
import strings from "../../strings";
import styles from "./Header.module.scss";

const OFFICE_DEVICE_PLATFORM = localStorage.getItem(strings.LS_DEVICE_PLATFORM);
const DIALOG_WIDTH = OFFICE_DEVICE_PLATFORM == "Mac" ? 100 : 90;
const DIALOG_HEIGHT = OFFICE_DEVICE_PLATFORM == "Mac" ? 100 : 80;

const defaultAccount = localStorage.getItem("default-account");

let dialog: Office.Dialog;

interface UserIconProps {
  children?: React.ReactNode;
  onClick: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const UserIcon = React.forwardRef<SVGSVGElement, UserIconProps>(({ onClick }, ref) => (
  <FontAwesomeIcon
    ref={ref}
    icon={faUserCircle}
    className={classNames("ms-4", styles.icon)}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  />
));
UserIcon.displayName = "UserIcon";

function Header() {
  const onAccountsClick = () => {
    renderPopup();
  };

  function renderPopup() {
    Office.context.ui.displayDialogAsync(
      window.location.origin + AccountPath,
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
            function regis_EventDialogMessageReceived(arg) {}
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
                  const auth = JSON.parse(localStorage.getItem("auth-tokens"));
                  const index = auth.findIndex((a) => a.email === defaultAccount);
                  if (index < 0) {
                    window.location.reload();
                  }
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

  return (
    <header>
      <div
        className={classNames("container-fluid d-flex p-3 align-items-center justify-content-between", styles.header)}
      >
        <img src={LogoWithText} alt="EB Control logo" className={styles.logo} />

        <div className="d-flex flex-row">
          <a className="text-body" href={SupportUrl} target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon={faQuestionCircle} className={styles.icon} />
          </a>

          <Dropdown>
            <Dropdown.Toggle as={UserIcon}></Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={onAccountsClick}>
                <FontAwesomeIcon icon={faUsers} /> {strings.componentHeaderAccounts}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

export default Header;
