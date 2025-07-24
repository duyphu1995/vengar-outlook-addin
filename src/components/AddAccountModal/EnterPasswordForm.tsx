import * as yup from 'yup';

import { Col, Form, Row } from 'react-bootstrap';
import React, { useEffect, useRef } from 'react';

import { useFormik } from 'formik';

interface FormFields {
  confirmPassword: string;
  password: string;
}

export type Actions = 'focus' | 'submit';

interface FormProps {
  confirm?: boolean;
  invoke: Actions | null | undefined;
  onSubmit: (password: string) => void;
}

export default function EnterPasswordForm({
  confirm,
  invoke,
  onSubmit
}: FormProps) {
  const ref = useRef(null);

  const schema = yup.object().shape({
    ...(confirm
      ? {
          confirmPassword: yup
            .string()
            .required('Password confirmation is required')
            .oneOf([yup.ref('password')], 'Passwords do not match'),
          password: yup
            .string()
            .required('Password is required')
            .min(8, 'Password must be at least 8 characters long')
            .matches(/[A-Z]/, 'Must contain 1 uppercase letter')
            .matches(/[a-z]/, 'Must contain 1 lowercase letter')
            .matches(/\d/, 'Must contain 1 digit')
            .matches(
              /[!@#$%^&*()+\-_=[\]{};':"|,.<>/?`\\]/,
              'Must contain 1 special character !@#$%^&*()+-_=[]{};\':"|,.<>/?`'
            )
        }
      : null)
  });

  const initialValues: FormFields = {
    confirmPassword: '',
    password: ''
  };

  function focus() {
    if (ref.current) {
      (ref.current as HTMLInputElement).focus();
    }
  }

  function onFormSubmit({ password }: FormFields) {
    onSubmit(password);
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
        <Col>Enter {confirm ? 'a' : 'your'} password</Col>
        <Col>
          <Form.Control
            ref={ref}
            type="password"
            autoComplete="off"
            name="password"
            isInvalid={
              (!!touched.password || submitCount > 0) && !!errors.password
            }
            // onBlur={handleBlur}
            onChange={handleChange}
            value={values.password}
          />
          <Form.Control.Feedback type="invalid">
            {(!!touched.password || submitCount > 0) &&
              !!errors.password &&
              errors.password}
          </Form.Control.Feedback>
        </Col>
      </Row>
      {confirm ? (
        <Row className="mt-2">
          <Col>Confirm password</Col>
          <Col>
            <Form.Control
              type="password"
              autoComplete="off"
              name="confirmPassword"
              isInvalid={
                (!!touched.confirmPassword || submitCount > 0) &&
                !!errors.confirmPassword
              }
              // onBlur={handleBlur}
              onChange={handleChange}
              value={values.confirmPassword}
            />
            <Form.Control.Feedback type="invalid">
              {(!!touched.confirmPassword || submitCount > 0) &&
                !!errors.confirmPassword &&
                errors.confirmPassword}
            </Form.Control.Feedback>
          </Col>
        </Row>
      ) : null}
      <input style={{ display: 'none' }} type="submit" />
    </Form>
  );
}
EnterPasswordForm.defaultProps = {
  confirm: false
};
