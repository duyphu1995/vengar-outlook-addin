import { Account, useAccounts, useAuth, useKeys } from '@ebi/hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import { NetworkError, useController } from 'rest-hooks';
import CheckEmailForm, { Actions as CheckEmailActions } from './CheckEmailForm';

import { accountExists } from '@ebi/api-client';
import useAppSettings from '../../hooks/useAppSettings';
import AsyncBoundary from '../AsyncBoundary';
import ConfirmModal from '../ConfirmModal';
import ErrorModal from '../ErrorModal';
import LoadingSpinner from '../LoadingSpinner';
import AccountVerification from './AccountVerification';
import EnterPasswordForm from './EnterPasswordForm';

type Dialog =
  | 'confirm-password-reset'
  | 'password-reset-success'
  | 'verification-resent-success';

interface Data {
  email: string;
  password: string;
}

interface AddModalProps {
  backdrop?: true | false | 'static';
  content?: React.ReactNode;
  header?: React.ReactNode;
  email: string;
  onHide?: () => void | undefined;
  onSubmit?: ({ email, password }: Account) => void;
}

type StepName = 'check-email' | 'login' | 'register' | 'verify';

interface Step {
  backButton: React.ReactNode;
  name: StepName;
  nextButton: React.ReactNode;
  render: () => React.ReactNode;
}

function AddModalContent({
  backdrop,
  content,
  header,
  email,
  onHide,
  onSubmit
}: AddModalProps) {
  const [data, setData] = useState<Data>({ email: email, password: '' });
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [invoke, setInvoke] = useState<CheckEmailActions | null>('focus');
  const [lockedOut, setLockedOut] = useState(false);
  const [step, setStep] = useState<StepName>('login');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { accounts, addAccount, fetchLicensing } = useAccounts();
  const { forgotPassword, login, register, resendVerificationEmail } =
    useAuth();
  const keys = useKeys();

  const { setDefaultAccount } = useAppSettings();

  const { fetch } = useController();

  useEffect(() => {
    if (invoke) {
      setInvoke(null);
    }
  }, [invoke, setInvoke]);

  const onBackClick = useCallback(() => {
    setStep('check-email');
  }, []);

  const onCheckEmailClick = useCallback(() => {
    setInvoke('submit');
  }, [setInvoke]);

  const onSubmitEmail = useCallback(
    async (email: string) => {
      try {
        if (accounts?.find((a) => a.email === email)) {
          throw new Error("You're already logged into this account");
        }

        setSubmitting(true);
        const response = await fetch(accountExists, {
          emails: [email],
          keys
        });
        setSubmitting(false);

        const [userExist] = response.userExistList;
        if (userExist.exists) {
          if (userExist.emailConfirmed) {
            setStep('login');
          } else {
            setStep('verify');
          }
        } else {
          setStep('register');
        }
        setInvoke('focus');

        setData({ ...data, email });
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          setError(err);
        }
      }
    },
    [accounts, keys, data, fetch]
  );

  const onLoginClick = useCallback(() => {
    setInvoke('submit');
  }, [setInvoke]);

  const onSubmitLoginPassword = useCallback(
    async (password: string) => {
      const updated = { ...data, password };
      try {
        setInvalidCredentials(false);
        setLockedOut(false);
        setSubmitting(true);
        const { accessToken } = await login(updated.email, updated.password);
        const account = await fetchLicensing(
          {
            automaticLogin: true,
            email: data.email,
            password
          },
          accessToken
        );
        setSubmitting(false);
        if (!accounts?.length) {
          setDefaultAccount(account.email);
        }
        addAccount(account);
        if (onSubmit) {
          onSubmit(account);
        }
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          if (err.message === 'invalid_username_or_password') {
            setInvalidCredentials(true);
          } else if (err.message === 'locked out') {
            setLockedOut(true);
          } else {
            setError(err);
          }
        }
      }
    },
    [
      accounts?.length,
      addAccount,
      data,
      fetchLicensing,
      login,
      onSubmit,
      setDefaultAccount
    ]
  );

  const onRegisterClick = useCallback(() => {
    setInvoke('submit');
  }, [setInvoke]);

  const onSubmitRegisterPassword = useCallback(
    async (password: string) => {
      const updated = { ...data, password };
      setData(updated);
      try {
        setSubmitting(true);
        await register(updated.email, updated.password);
        setSubmitting(false);
        setStep('verify');
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          setError(err);
        }
      }
    },
    [data, register]
  );

  const onForgotPasswordClick = useCallback(() => {
    setDialog('confirm-password-reset');
  }, []);

  const onCloseDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const onConfirmForgotPassword = useCallback(async () => {
    try {
      setSubmitting(true);
      const response = await forgotPassword(data.email);
      setSubmitting(false);

      if ('isSuccessful' in response) {
        const isSuccessful = response.isSuccessful as boolean;
        if (isSuccessful) {
          setDialog('password-reset-success');
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
  }, [data, forgotPassword]);

  const onResendVerificationEmailClick = useCallback(async () => {
    try {
      setSubmitting(true);
      const response = await resendVerificationEmail(data.email);
      setSubmitting(false);

      if (response === true) {
        setDialog('verification-resent-success');
      } else {
        setError(new Error(`Error: ${JSON.stringify(response)}`));
      }
    } catch (err: unknown) {
      setSubmitting(false);
      if (err instanceof Error) {
        setError(err);
      }
    }
  }, [data.email, resendVerificationEmail]);

  const onAccountVerified = useCallback(async () => {
    if (data.email && data.password) {
      const { accessToken } = await login(data.email, data.password);
      const account = await fetchLicensing(
        {
          automaticLogin: true,
          email: data.email,
          password: data.password
        },
        accessToken
      );

      if (!accounts?.length) {
        setDefaultAccount(account.email);
      }
      addAccount(account);
      if (onSubmit) {
        onSubmit(account);
      }
    } else {
      setStep('login');
    }
  }, [
    accounts?.length,
    addAccount,
    data.email,
    data.password,
    fetchLicensing,
    login,
    onSubmit,
    setDefaultAccount
  ]);

  function renderCheckEmail() {
    return <CheckEmailForm invoke={invoke} onSubmit={onSubmitEmail} />;
  }

  function renderLogin() {
    return (
      <>
        {invalidCredentials ? (
          <Alert variant="danger">
            Invalid username and password combination.
          </Alert>
        ) : null}
        {lockedOut ? (
          <Alert variant="danger">
            You have been temporarily locked out after too many failed log in
            attempts. Wait some time and try again or reset your password to
            continue.
          </Alert>
        ) : null}
        <p>Please enter your password to log in</p>
        <EnterPasswordForm invoke={invoke} onSubmit={onSubmitLoginPassword} />
        <br />
        <Button variant="outline-primary" onClick={onForgotPasswordClick}>
          Forgot Password?
        </Button>
      </>
    );
  }

  function renderRegister() {
    return (
      <>
        <p>
          You&apos;ve not yet registered this account, please enter a password
          to continue
        </p>
        <EnterPasswordForm
          confirm
          invoke={invoke}
          onSubmit={onSubmitRegisterPassword}
        />
      </>
    );
  }

  function renderAccountVerify() {
    return (
      <AccountVerification
        email={data.email}
        onVerified={onAccountVerified}
        wasSentPrior={!data.password}
      />
    );
  }

  const steps: Step[] = [
    {
      backButton:
        backdrop === 'static' ? null : (
          <Button variant="secondary" disabled={submitting} onClick={onHide}>
            Nevermind
          </Button>
        ),
      name: 'check-email',
      nextButton: (
        <Button
          variant="primary"
          disabled={submitting}
          onClick={onCheckEmailClick}>
          Check if Account exists
        </Button>
      ),
      render: renderCheckEmail
    },
    {
      backButton: (
        <Button variant="secondary" disabled={submitting} onClick={onHide}>
          Cancel
        </Button>
      ),
      name: 'login',
      nextButton: (
        <Button variant="primary" disabled={submitting} onClick={onLoginClick}>
          Log In
        </Button>
      ),
      render: renderLogin
    },
    {
      backButton: (
        <Button variant="secondary" disabled={submitting} onClick={onBackClick}>
          Back
        </Button>
      ),
      name: 'register',
      nextButton: (
        <Button
          variant="primary"
          disabled={submitting}
          onClick={onRegisterClick}>
          Register
        </Button>
      ),
      render: renderRegister
    },
    {
      backButton:
        backdrop === 'static' ? null : (
          <Button variant="secondary" disabled={submitting} onClick={onHide}>
            Verify later
          </Button>
        ),
      name: 'verify',
      nextButton: (
        <Button
          variant="secondary"
          disabled={submitting}
          onClick={onResendVerificationEmailClick}>
          Resend Email
        </Button>
      ),
      render: renderAccountVerify
    }
  ];

  function renderStep() {
    const activeStep = steps.find((s) => s.name === step);
    if (activeStep) {
      return activeStep.render();
    }
    return null;
  }

  function renderStepActions() {
    const activeStep = steps.find((s) => s.name === step);
    if (activeStep) {
      return (
        <>
          {activeStep.backButton}
          {submitting ? (
            <Button variant="primary">
              <LoadingSpinner size="sm" />
            </Button>
          ) : (
            activeStep.nextButton
          )}
        </>
      );
    }
    return null;
  }

  function renderConfirmForgotPasswordDialog() {
    return (
      <ConfirmModal
        onCancel={onCloseDialog}
        onConfirm={onConfirmForgotPassword}
        content="Are you sure you want to start the password reset process?"
        confirmButton="Reset Password"
        show 
        modalType={'confirm'}
      />
    );
  }

  function renderPasswordResetSuccessDialog() {
    return (
      <ConfirmModal
        onConfirm={onCloseDialog}
        content="A password reset link has been e-mailed to you"
        confirmButton="OK"
        show
        modalType={'confirm'}
      />
    );
  }

  function renderVerificationResentSuccessDialog() {
    return (
      <ConfirmModal
        onConfirm={onCloseDialog}
        content={`A new account verification link has been sent to ${data.email}`}
        confirmButton="OK"
        show
        modalType={'confirm'}
      />
    );
  }

  function renderDialogs() {
    switch (dialog) {
      case 'confirm-password-reset':
        return renderConfirmForgotPasswordDialog();
      case 'password-reset-success':
        return renderPasswordResetSuccessDialog();
      case 'verification-resent-success':
        return renderVerificationResentSuccessDialog();
      default:
        return null;
    }
  }

  return (
    <>
      {header ? (
        <Modal.Header closeButton>
          <Modal.Title>{header}</Modal.Title>
        </Modal.Header>
      ) : null}

      <Modal.Body>
        {step === 'check-email' ? content : null}
        {renderStep()}
      </Modal.Body>

      <Modal.Footer>{renderStepActions()}</Modal.Footer>
      <ErrorModal error={error} onHide={() => setError(null)} />
      {renderDialogs()}
    </>
  );
}

export default function AddAccountModal({
  backdrop,
  content,
  header,
  email,
  onHide,
  onSubmit
}: AddModalProps) {
  return (
    <>
      <Modal show onHide={onHide} backdrop={backdrop}>
        <AsyncBoundary
          errorFallback={({ error }: { error: NetworkError }) => (
            <Modal.Body>
              <Alert variant="danger">{error.message}</Alert>
            </Modal.Body>
          )}
          loadingFallback={() => (
            <Modal.Body>
              <LoadingSpinner />
            </Modal.Body>
          )}>
          <AddModalContent
            backdrop={backdrop}
            content={content}
            header={header}
            email={email}
            onHide={onHide}
            onSubmit={onSubmit}
          />
        </AsyncBoundary>
      </Modal>
    </>
  );
}
const defaultProps = {
  backdrop: true,
  content: undefined,
  header: undefined,
  onHide: undefined,
  onSubmit: undefined
};
AddAccountModal.defaultProps = defaultProps;
AddModalContent.defaultProps = defaultProps;
