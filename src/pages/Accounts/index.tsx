import "../../App.scss";
import "./Accounts.module.scss";

import { Account, ConfigProvider, StorageProvider, useAccounts, useAuth } from "@ebi/hooks";
import { DataGrid, SortColumn } from "@ebi/ui";
import { Suspense, useCallback, useEffect, useState } from "react";

import { BaseResource } from "@ebi/api-client";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import template from "lodash/template";
import moment from "moment";
import React from "react";
import { Button } from "react-bootstrap";
import { createRoot } from "react-dom/client";
import { CacheProvider } from "rest-hooks";
import { VConfigApp, VCheckIsExpired } from "../../ultils/VUltils";
import { LogoWithText } from "../../assets/index";
import AddAccountModal from "../../components/AddAccountModal";
import AsyncBoundary from "../../components/AsyncBoundary";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";
import useAppSettings from "../../hooks/useAppSettings";
import strings from "../../strings";
import styles from "./Accounts.module.scss";

type Dialog = "sign_out" | "sign_in" | "remove";
type SortableAccount = null | Pick<Account, "email">;

const ConfirmRemoveTemplate = template(strings.pageAccountsConfirmRemoveTemplate);

interface AccountRow {
  row: Account;
}

const ConfirmSignOutTemplate = template(strings.pageAccountsConfirmSignOutTemplate);

function pk(item: Account) {
  return item.email;
}

function normalize(value: null | string) {
  if (value === null) {
    return "";
  }
  return value.toLowerCase();
}

function LoadingFallback() {
  return null;
}

function Accounts() {
  const { accounts, removeAccount, updateAccount } = useAccounts();

  const { defaultAccount, setDefaultAccount } = useAppSettings();
  const [isConfirmSignOut, setIsConfirmSignOut] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    columnKey: "email",
    direction: "ASC",
  });
  const { clearAccessToken } = useAuth();

  const onHideDialog = useCallback(() => {
    setDialog(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [setDialog]);

  const onSignOutAccountClick = useCallback((account: Account) => {
    const mCheckAccountExpired = VCheckIsExpired(account);
    setActiveAccount(account);
    mCheckAccountExpired.authDefault?.length > 0 ? setDialog("sign_out") : setDialog("sign_in");
  }, []);

  const onConfirmSignOut = useCallback(() => {
    if (activeAccount) {
      setIsConfirmSignOut(true);
      clearAccessToken(activeAccount.email);
      if (activeAccount.email === defaultAccount && accounts) {
        const [newDefault] = accounts.filter((a) => a.email !== activeAccount.email);
        if (newDefault) {
          setDefaultAccount(newDefault.email);
        }
      }
    }
    setActiveAccount(null);
    setDialog(null);
    setIsConfirmSignOut(false);
  }, [accounts, activeAccount, defaultAccount, removeAccount, setDefaultAccount]);

  const onSortColumnChange = useCallback(
    (sc: SortColumn) => {
      setSortColumn(sc);
    },
    [setSortColumn]
  );

  function accountSorter(a: Account, b: Account) {
    const keyA = sortColumn.columnKey as keyof SortableAccount;
    const keyB = sortColumn.columnKey as keyof SortableAccount;
    const valueA = normalize(a[keyA]);
    const valueB = normalize(b[keyB]);
    if (valueA > valueB) {
      return sortColumn.direction === "ASC" ? 1 : -1;
    }
    if (valueA < valueB) {
      return sortColumn.direction === "ASC" ? -1 : 1;
    }
    return 0;
  }

  const onChangeAccountAutomaticLogin = useCallback(
    (account: Account) => {
      const updated = {
        ...account,
        automaticLogin: !account.automaticLogin,
      };
      updateAccount(updated);
    },
    [updateAccount]
  );

  function AccountAutomaticLoginFormatter({ row: account }: AccountRow) {
    return (
      <div
        className={classNames("flex-shrink-1 bd-highlight", "d-flex align-items-center", "form-check", "form-switch")}
      >
        <input
          className={classNames("form-check-input", "success", styles.switch)}
          type="checkbox"
          role="switch"
          checked={account.automaticLogin}
          onChange={() => {
            onChangeAccountAutomaticLogin(account);
          }}
        />
      </div>
    );
  }

  function AccountTypeFormatter({ row: account }: AccountRow) {
    const isFree =
      account.userType?.toLowerCase() === "free" || account.licensing?.licenseName.toLowerCase() === "free";
    return isFree ? (
      <>
        <span className={styles.freeLabel}>{strings.pageAccountsFreeLabel}</span>
      </>
    ) : (
      <>{account.licensing?.licenseName}</>
    );
  }

  function AccountSignOutFormatter({ row: account }: AccountRow) {
    const mCheckAccountExpired = VCheckIsExpired(account);
    const [buttonText, setButtonText] = useState(
      !mCheckAccountExpired.isExpired ? strings.pageAccountsSignOut : strings.pageAccountsSignIn
    );

    useEffect(() => {
      const mCheckAccountExpired = VCheckIsExpired(account);
      setButtonText(!mCheckAccountExpired.isExpired ? strings.pageAccountsSignOut : strings.pageAccountsSignIn);
    }, [isConfirmSignOut]);
    return (
      <div>
        <Button id={account.email} variant="outline-light" onClick={() => onSignOutAccountClick(account)}>
          {buttonText}
        </Button>
      </div>
    );
  }

  function AccountActionsFormatter({ row: account }: AccountRow) {
    return (
      <Button variant="" onClick={() => onRemoveAccountClick(account)}>
        <FontAwesomeIcon icon={faTrashCan} />
      </Button>
    );
  }

  const onRemoveAccountClick = useCallback((account: Account) => {
    setActiveAccount(account);
    setDialog("remove");
  }, []);

  const onConfirmRemove = useCallback(() => {
    if (activeAccount) {
      removeAccount(activeAccount);

      if (activeAccount.email === defaultAccount && accounts) {
        const [newDefault] = accounts.filter((a) => a.email !== activeAccount.email);
        if (newDefault) {
          setDefaultAccount(newDefault.email);
        }
      }
    }
    setActiveAccount(null);
    setDialog(null);
  }, [accounts, activeAccount, defaultAccount, history, removeAccount, setDefaultAccount]);

  function renderAddDialog() {
    return <AddAccountModal onHide={onHideDialog} onSubmit={onHideDialog} email={activeAccount.email} />;
  }

  function renderSignOutDialog() {
    return (
      <ConfirmModal
        show
        content={ConfirmSignOutTemplate({
          email: activeAccount?.email,
        })}
        confirmButton={strings.pageAccountsConfirmSignOut}
        onCancel={onHideDialog}
        onConfirm={onConfirmSignOut}
        modalType={"confirm"}
      />
    );
  }

  function renderRemoveDialog() {
    return (
      <ConfirmModal
        show
        content={ConfirmRemoveTemplate({
          email: activeAccount?.email,
        })}
        confirmButton={strings.pageAccountsConfirmRemove}
        onCancel={onHideDialog}
        onConfirm={onConfirmRemove}
        modalType={"confirm"}
      />
    );
  }

  function renderDialogs() {
    switch (dialog) {
      case "sign_out":
        return renderSignOutDialog();
      case "sign_in":
        return renderAddDialog();
      case "remove":
        return renderRemoveDialog();
      default:
        return null;
    }
  }

  const columns = [
    { key: "email", name: strings.pageAccountsColumnEmail, sortable: true },
    {
      key: "type",
      name: strings.pageAccountsColumnType,
      formatter: AccountTypeFormatter,
    },
    {
      key: "automatic-login",
      name: strings.pageAccountsColumnAutomaticLogin,
      formatter: AccountAutomaticLoginFormatter,
    },
    {
      key: "sign-out",
      name: strings.pageAccountsColumnStatus,
      formatter: AccountSignOutFormatter,
    },
    {
      key: "actions",
      name: strings.pageAccountsColumnActions,
      formatter: AccountActionsFormatter,
    },
  ];

  function renderAccounts() {
    const sorted = accounts ? accounts.slice(0) : [];
    sorted.sort(accountSorter);

    return (
      <div className={styles.dataGrid}>
        <DataGrid
          columns={columns}
          rows={sorted}
          pk={pk}
          sortColumn={sortColumn}
          onSortColumnChange={onSortColumnChange}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={classNames("container-fluid d-flex p-3 align-items-center justify-content-between", styles.header)}
      >
        <img src={LogoWithText} alt="EB Control logo" className={styles.logo} />
      </div>
      <div className={styles.accountsContainer}>
        <div className={styles.txtEBAccount}>
          <h2>{strings.pageAccountsEBControlAccounts}</h2>
        </div>
        <div className={styles.txtLoginto}>
          <label>{strings.pageAccountsLogIntoEB}</label>
        </div>
        {renderAccounts()}
      </div>
      {renderDialogs()}
    </>
  );
}

function renderLoading() {
  return (
    <div className={styles.loading}>
      <LoadingSpinner />
    </div>
  );
}

export default function AccountsWithSuspense() {
  BaseResource.apiUrl = process.env.REACT_APP_API_URL;
  return (
    <CacheProvider>
      <ConfigProvider config={VConfigApp()}>
        <StorageProvider storage={localStorage}>
          <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={renderLoading}>
            <Accounts />
          </AsyncBoundary>
        </StorageProvider>
      </ConfigProvider>
    </CacheProvider>
  );
}

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

Office.onReady(() => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <AccountsWithSuspense />
      </Suspense>
    </React.StrictMode>
  );
});
