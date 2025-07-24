import { Alert, Button, Modal } from "react-bootstrap";
import EnterPasswordForm, { Actions } from "../AddAccountModal/EnterPasswordForm";
import React, { useCallback, useEffect, useState } from "react";

import AsyncBoundary from "../AsyncBoundary";
import ConfirmModal from "../ConfirmModal";
import LoadingSpinner from "../LoadingSpinner";
import NetworkErrorMessage from "../NetworkErrorMessage";
import { useAuth } from "@ebi/hooks";

type Dialog = "confirm-password-reset" | "password-reset-success";

interface LoginModalProps {
  content?: React.ReactNode;
  email: string;
  header?: React.ReactNode;
  onCancel?: () => void | null | undefined;
  onLogin: (accessToken: string, password: string) => void;
  show: boolean;
}

const defaultProps = {
  content: null,
  header: null,
  onCancel: null,
};

function LoginModal({ content, email, header, onCancel, onLogin, show }: LoginModalProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [invoke, setInvoke] = useState<Actions | null>(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { forgotPassword, login } = useAuth();

  useEffect(() => {
    if (invoke) {
      setInvoke(null);
    }
  }, [invoke, setInvoke]);

  const onLoginClick = useCallback(() => {
    setInvoke("submit");
  }, []);

  const onSubmitPassword = useCallback(
    async (password: string) => {
      try {
        setError(null);
        setInvalidCredentials(false);
        setLockedOut(false);
        setSubmitting(true);
        const { accessToken } = await login(email, password);
        setSubmitting(false);
        onLogin(accessToken, password);
      } catch (err) {
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
    [email, login, onLogin]
  );

  const onForgotPasswordClick = useCallback(() => {
    setDialog("confirm-password-reset");
  }, []);

  const onCloseDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const onConfirmForgotPassword = useCallback(async () => {
    try {
      setSubmitting(true);
      const response = await forgotPassword(email);
      setSubmitting(false);

      if ("isSuccessful" in response) {
        const isSuccessful = response.isSuccessful as boolean;
        if (isSuccessful) {
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

  function renderConfirmForgotPasswordDialog() {
    return (
      <ConfirmModal
        onCancel={onCloseDialog}
        onConfirm={onConfirmForgotPassword}
        content="Are you sure you want to start the password reset process?"
        confirmButton="Reset Password"
        modalType="confirm"
        show
      />
    );
  }

  function renderPasswordResetSuccessDialog() {
    return (
      <ConfirmModal
        onConfirm={onCloseDialog}
        content="Reset password email has been sent."
        confirmButton="OK"
        modalType="success"
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

  return (
    <>
      <Modal show={show}>
        {header ? <Modal.Header>{header}</Modal.Header> : null}

        <Modal.Body>
          {error ? <Alert variant="danger">{error.message}</Alert> : null}
          {invalidCredentials ? <Alert variant="danger">Invalid username and password combination.</Alert> : null}
          {lockedOut ? (
            <Alert variant="danger">
              You have been temporarily locked out after too many failed log in attempts. Wait some time and try again
              or reset your password to continue.
            </Alert>
          ) : null}
          {content}
          <EnterPasswordForm invoke={invoke} onSubmit={onSubmitPassword} />
          <Button variant="outline-primary" onClick={onForgotPasswordClick}>
            Forgot Password?
          </Button>
        </Modal.Body>

        <Modal.Footer>
          {onCancel ? (
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              Nevermind
            </Button>
          ) : null}
          <Button variant="primary" disabled={submitting} onClick={onLoginClick}>
            {submitting ? <LoadingSpinner size="sm" /> : "Login"}
          </Button>
        </Modal.Footer>
      </Modal>
      {renderDialogs()}
    </>
  );
}

export default function Open(props: LoginModalProps) {
  return (
    <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={() => null}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <LoginModal {...props} />
    </AsyncBoundary>
  );
}

LoginModal.defaultProps = defaultProps;
Open.defaultProps = defaultProps;
