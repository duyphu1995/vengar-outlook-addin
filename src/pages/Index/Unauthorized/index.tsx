import React, { useCallback, useEffect, useRef, useState } from "react";

import { VUserExists } from "@ebi/protobuffers";
import { LogoWithText } from "../../../assets/index";
import CheckEmailForm from "./CheckEmailForm";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import styles from "./Unauthorized.module.scss";
import VerifyAccount from "./VerifyAccount";

type StepName = "check-email" | "login" | "register" | "verify";

export default function UnauthorizedIndex() {
  const [email, setEmail] = useState<string | null>("");
  const previousStep = useRef<StepName | null>("check-email");
  const [step, setStep] = useState<StepName>("check-email");

  useEffect(() => {
    previousStep.current = step;
  }, [step]);

  const onBackClick = useCallback(() => {
    setStep("check-email");
  }, [setStep]);

  const onSubmitCheckEmail = useCallback(
    ({ emailConfirmed, exists, userId }: VUserExists) => {
      setEmail(userId);
      if (exists) {
        if (emailConfirmed) {
          setStep("login");
        } else {
          setStep("verify");
        }
      } else {
        setStep("register");
      }
    },
    [setStep]
  );

  const onRegister = useCallback(() => {
    setStep("verify");
  }, [setStep]);

  const onAccountVerified = useCallback(() => {
    setStep("login");
  }, [setStep]);

  function renderCheckEmail() {
    return <CheckEmailForm onSubmit={onSubmitCheckEmail} />;
  }

  function renderLogin() {
    if (!email) {
      return null;
    }
    return <LoginForm email={email} onBackClick={onBackClick} />;
  }

  function renderRegister() {
    if (!email) {
      return null;
    }
    return <RegisterForm email={email} onBackClick={onBackClick} onRegister={onRegister} />;
  }

  function renderAccountVerify() {
    if (!email) {
      return null;
    }
    const fromLogin = previousStep.current === "login";

    return <VerifyAccount email={email} fromLogin={fromLogin} onVerified={onAccountVerified} />;
  }

  function renderStep() {
    switch (step) {
      case "check-email":
        return renderCheckEmail();
      case "login":
        return renderLogin();
      case "register":
        return renderRegister();
      case "verify":
        return renderAccountVerify();
    }
  }

  return (
    <div className="flex-fill d-flex flex-column justify-content-center align-items-center">
      <img src={LogoWithText} alt="EB Control logo" className={styles.logo} />
      {renderStep()}
    </div>
  );
}
