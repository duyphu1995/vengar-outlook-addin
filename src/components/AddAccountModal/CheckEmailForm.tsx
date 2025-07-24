import * as yup from 'yup';

import { Col, Form, Row } from 'react-bootstrap';
import React, { useEffect, useRef } from 'react';

import { useFormik } from 'formik';

interface FormFields {
  email: string;
}

const schema = yup.object().shape({
  email: yup
    .string()
    .email('Must be a valid email address')
    .required('Email is required')
});

export type Actions = 'focus' | 'submit';

interface FormProps {
  invoke: Actions | null | undefined;
  onSubmit: (email: string) => void;
}

export default function CheckEmailForm({ invoke, onSubmit }: FormProps) {
  const ref = useRef(null);

  const initialValues: FormFields = {
    email: ''
  };

  function focus() {
    if (ref.current) {
      (ref.current as HTMLInputElement).focus();
    }
  }

  function onFormSubmit({ email }: FormFields) {
    onSubmit(email);
  }

  const {
    touched,
    errors,
    // handleBlur,
    handleChange,
    handleSubmit,
    submitForm,
    submitCount,
    values
  } = useFormik({
    initialValues,
    onSubmit: onFormSubmit,
    validationSchema: schema
  });

  useEffect(() => {
    switch (invoke) {
      case 'focus':
        focus();
        break;
      case 'submit':
        submitForm();
        break;
      default:
        break;
    }
  }, [invoke, submitForm]);

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Row>
        <Col>Enter your email address</Col>
        <Col>
          <Form.Control
            ref={ref}
            type="text"
            autoComplete="off"
            name="email"
            isInvalid={(!!touched.email || submitCount > 0) && !!errors.email}
            // onBlur={handleBlur}
            onChange={handleChange}
            value={values.email}
          />
          <Form.Control.Feedback type="invalid">
            {(!!touched.email || submitCount > 0) &&
              !!errors.email &&
              errors.email}
          </Form.Control.Feedback>
        </Col>
      </Row>
    </Form>
  );
}
