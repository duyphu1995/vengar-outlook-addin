import * as yup from "yup";

import { useAccounts, useAuth } from "@ebi/hooks";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";

import classNames from "classnames";
import { useFormik } from "formik";
import { Link } from "react-router-dom";
import ConfirmModal from "../../../components/ConfirmModal";
import ErrorModal from "../../../components/ErrorModal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import useAppSettings from "../../../hooks/useAppSettings";
import Context from "../../../pages/Secure/Context";

import strings from "../../../strings";
import styles from "./Unauthorized.module.scss";
import { VOJS_ConvertToRestId } from "../../../ultils/VOfficeUltils";
import { getMessageByID } from "../../../helpers/sso-helper";

const ACC_KEY_NAME = "accounts";
type Dialog = "confirm-password-reset" | "password-reset-success";

Office.initialize = async function () {
  // Event Item Changed: if the task pane can be pinned -> when clicking on a different email -> update the mail item and call the function "onGetAttachment" again
  await process_loading_message();
};

// Office.onReady(async () => {
//   console.log("Office is ready!");
//   await process_loading_message();
// });

async function process_loading_message() {
  const messageID = VOJS_ConvertToRestId(Office.context.mailbox.item.itemId);
  await getMessageByID(process_get_message_by_id, messageID);
}

function process_get_message_by_id(result: Object) {
  localStorage.setItem(strings.LS_MAIL_ITEM, JSON.stringify(result));
}

interface FormFields {
  email: string;
  password: string;
}

const schema = yup.object().shape({
  password: yup.string().required("Password is required"),
});

interface ILoginFormProps {
  email: string;
  onBackClick: () => void;
}

export default function LoginForm({ email, onBackClick }: ILoginFormProps) {
  const initialValues: FormFields = useMemo(
    () => ({
      email,
      password: "",
    }),
    [email]
  );

  const { accounts, addAccount, fetchLicensing, removeAccount } = useAccounts();
  const { forgotPassword, login } = useAuth();

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [element, setElement] = useState<HTMLInputElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isResetConfirm, setIsResetConfirm] = useState(false);
  const { setDefaultAccount } = useAppSettings();
  const { setIsLogin } = useContext(Context);

  useEffect(() => {
    if (element === null) {
      return;
    }
    element.focus();
  }, [element]);

  const onFormSubmit = useCallback(
    async ({ password }: FormFields) => {
      setInvalidCredentials(false);
      setLockedOut(false);
      setSubmitting(true);

      try {
        const token = await login(email, password);
        const account = await fetchLicensing({ email }, token.accessToken);
        addAccount(account);
        setDefaultAccount(account.email);
        setSubmitting(false);
        setIsLogin(true);

        const auth = JSON.parse(localStorage.getItem("auth-tokens"));
        let authDefault = auth ? auth.filter((auth) => auth.email === account.email) : null;
        let currAuthAccount = authDefault[authDefault.length - 1];
        const newArrAuth = auth.filter((element) => !(element.email == account.email));
        newArrAuth.push(currAuthAccount);
        localStorage.setItem("auth-tokens", JSON.stringify(newArrAuth));
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          if (err.message === "invalid_username_or_password") {
            setInvalidCredentials(true);
          } else if (err.message === "locked out") {
            setLockedOut(true);
          } else {
            setError(err);
          }
        }
      }
    },
    [email, fetchLicensing, addAccount, login]
  );

  const onConfirmForgotPassword = useCallback(async () => {
    try {
      setIsResetConfirm(true);
      setSubmitting(true);
      const response = await forgotPassword(email);
      setSubmitting(false);
      if ("isSuccessful" in response) {
        const isSuccessful = response.isSuccessful as boolean;
        if (isSuccessful) {
          if (accounts !== null && accounts.length > 0) removeAccount(accounts.find((acc) => (acc.email = email)));
          localStorage.removeItem(ACC_KEY_NAME);
          setDialog("password-reset-success");
        } else {
          setError(new Error(`Error: ${response.message}`));
        }
      } else {
        setDialog(null);
      }
    } catch (err: unknown) {
      setSubmitting(false);
      if (err instanceof Error) {
        setError(err);
      }
    }
  }, [email, forgotPassword]);

  const onHideError = useCallback(() => {
    setError(null);
  }, []);

  const onForgotPasswordClick = useCallback(() => {
    setDialog("confirm-password-reset");
  }, []);

  const onCloseDialog = useCallback(() => {
    setDialog(null);
  }, []);

  function renderConfirmForgotPasswordDialog() {
    return (
      <ConfirmModal
        confirmButton={submitting ? <LoadingSpinner size="sm" /> : "Reset Password"}
        content="Are you sure you want to start the password reset process?"
        header="Confirmation"
        modalType="confirm"
        onCancel={onCloseDialog}
        onConfirm={onConfirmForgotPassword}
        show
      />
    );
  }

  function renderPasswordResetSuccessDialog() {
    return (
      <ConfirmModal
        content="A password reset link has been e-mailed to you"
        confirmButton="Okay"
        header="Success"
        modalType="success"
        onConfirm={onCloseDialog}
        show
      />
    );
  }

  function renderDialogs() {
    switch (dialog) {
      case "confirm-password-reset":
        return renderConfirmForgotPasswordDialog();
      case "password-reset-success":
        return renderPasswordResetSuccessDialog();
      default:
        return null;
    }
  }

  const { touched, errors, handleChange, handleSubmit, submitCount, values } = useFormik({
    initialValues,
    onSubmit: onFormSubmit,
    validationSchema: schema,
  });

  return (
    <>
      <Card bg="dark" className={classNames("my-5", styles.loginContainer)}>
        <Card.Body>
          <Card.Title className="text-label">{strings.pageIndexLoginTitle}</Card.Title>
          <Card.Text>{strings.pageIndexLoginText}</Card.Text>
          {invalidCredentials ? <Alert variant="danger">Invalid username and password combination.</Alert> : null}
          {lockedOut ? (
            <Alert variant="danger">
              You have been temporarily locked out after too many failed log in attempts. Wait some time and try again
              or reset your password to continue.
            </Alert>
          ) : null}
          <Form className="d-flex flex-column" noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Control
                type="email"
                className="text-dark"
                placeholder={strings.pageIndexRegisterEmailPlaceholder}
                name="email"
                disabled
                isInvalid={(!!touched.email || submitCount > 0) && !!errors.email}
                onChange={handleChange}
                value={values.email}
              />
              <Form.Control.Feedback type="invalid">
                {(!!touched.email || submitCount > 0) && !!errors.email && errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Control
                ref={setElement}
                type="password"
                className="bg-light text-dark"
                placeholder={strings.pageIndexLoginPasswordPlaceholder}
                name="password"
                isInvalid={(!!touched.password || submitCount > 0) && !!errors.password}
                onChange={handleChange}
                value={values.password}
              />
              <Form.Control.Feedback type="invalid">
                {(!!touched.password || submitCount > 0) && !!errors.password && errors.password}
              </Form.Control.Feedback>
              <Form.Text className="d-block text-end">
                <Link to={""} className="text-secondary" onClick={onForgotPasswordClick}>
                  {strings.pageIndexLoginForgot}
                </Link>
              </Form.Text>
            </Form.Group>

            <div className="d-flex flex-row justify-content-between">
              <Button variant="outline-secondary" onClick={onBackClick}>
                {strings.back}
              </Button>

              {submitting && !isResetConfirm ? (
                <Button className="flex-fill ms-3" variant="primary" disabled>
                  <LoadingSpinner size="sm" />
                </Button>
              ) : (
                <Button className="flex-fill ms-3" type="submit">
                  {strings.pageIndexLoginSubmit}
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <ErrorModal error={error} onHide={onHideError} />
      {renderDialogs()}
    </>
  );
}
