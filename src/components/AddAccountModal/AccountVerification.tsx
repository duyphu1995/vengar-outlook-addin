import { useAccountVerification } from '@ebi/hooks';
import React from 'react';
import { AccountVerificationTimeout } from '../../consts';
import Counter from '../Counter';

interface AccountVerificationProps {
  email: string;
  onVerified: () => void;
  wasSentPrior?: boolean;
}

export default function AccountVerification({
  email,
  onVerified,
  wasSentPrior
}: AccountVerificationProps) {
  useAccountVerification({ email, onVerified });

  return (
    <div>
      <p>
        An email {wasSentPrior ? 'was previously' : 'has been'} sent to {email}{' '}
        for verification. Please locate the email in your inbox or spam folder
        and click on the link.
      </p>
      Waiting for verification -{' '}
      <Counter timeout={AccountVerificationTimeout} />
    </div>
  );
}

AccountVerification.defaultProps = {
  wasSentPrior: false
};
