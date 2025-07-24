import { Button, Modal } from 'react-bootstrap';

import React from 'react';

interface VerifyAccountModalProps {
  email: string;
  show?: boolean;
}

export default function VerifyAccountModal({
  email,
  show
}: VerifyAccountModalProps) {
  return (
    <Modal show={show} backdrop="static">
      <Modal.Header>Verify Account</Modal.Header>
      <Modal.Body>
        An email has been sent to {email} for verification. Please locate the
        email in your inbox or spam folder and click on the link.
      </Modal.Body>
      <Modal.Footer>
        <Button>Verify later</Button>
        <Button variant="primary">Resend</Button>
      </Modal.Footer>
    </Modal>
  );
}

VerifyAccountModal.defaultProps = {
  show: false
};
