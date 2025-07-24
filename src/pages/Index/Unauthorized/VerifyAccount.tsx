import { useAccountVerification } from "@ebi/hooks";
import React from "react";
import { Alert } from "react-bootstrap";
import Counter from "../../../components/Counter";
import { AccountVerificationTimeout } from '../../../consts';
import styles from "./Unauthorized.module.scss";

interface IVerifyAccountProps {
  email: string;
  fromLogin: boolean;
  onVerified: () => void;
}

export default function VerifyAccount({ email, fromLogin, onVerified }: IVerifyAccountProps) {
  useAccountVerification({ email, onVerified });

  return (
    <div className={styles.alertContainer}>
      <Alert className="mt-4">
        An email {fromLogin ? "was previously" : "has been"} sent to {email} for verification. Please locate the email
        in your inbox or spam folder and click on the link.
      </Alert>
      <div style={{ textAlign: "center" }}>
        Waiting for verification - <Counter timeout={AccountVerificationTimeout} />
      </div>
    </div>
  );
}
