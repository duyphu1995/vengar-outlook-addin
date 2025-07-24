import * as yup from "yup";

import { faCheckCircle, faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";

import { useAuth } from "@ebi/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useFormik } from "formik";
import ErrorModal from "../../../components/ErrorModal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import strings from "../../../strings";
import styles from "./Unauthorized.module.scss";

interface FormFields {
  confirmPassword: string;
  email: string;
  password: string;
}

const digitRegex = /\d/;
const lengthRegex = /.{8}/;
const lowercaseRegex = /[a-z]/;
const specialRegex = /[!@#$%^&*()+\-_=[\]{};':"|,.<>/?`\\]/;
const uppercaseRegex = /[A-Z]/;

const schema = yup.object().shape({
  confirmPassword: yup
    .string()
    .required("Password confirmation is required")
    .oneOf([yup.ref("password")], "Passwords do not match"),
  email: yup.string().email("Must be a valid email address").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(uppercaseRegex, "Must contain 1 uppercase letter")
    .matches(lowercaseRegex, "Must contain 1 lowercase letter")
    .matches(digitRegex, "Must contain 1 digit")
    .matches(specialRegex, "Must contain 1 special character !@#$%^&*()+-_=[]{};':\"|,.<>/?`"),
});

interface IRegisterFormProps {
  email: string;
  onBackClick: () => void;
  onRegister: () => void;
}

interface IPasswordRequirement {
  name: string;
  regex: RegExp;
  text: string;
}

export default function RegisterForm({ email, onBackClick, onRegister }: IRegisterFormProps) {
  const initialValues: FormFields = useMemo(() => ({ confirmPassword: "", email, password: "" }), [email]);

  const { register } = useAuth();

  const [element, setElement] = useState<HTMLInputElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (element === null) {
      return;
    }
    element.focus();
  }, [element]);

  const onFormSubmit = useCallback(
    async ({ password }: FormFields) => {
      try {
        setSubmitting(true);
        await register(email, password);
        setSubmitting(false);
        onRegister();
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          setError(err);
        }
      }
    },
    [email, onRegister, register]
  );

  const onHideError = useCallback(() => {
    setError(null);
  }, []);

  const { touched, errors, handleChange, handleSubmit, submitCount, values } = useFormik({
    initialValues,
    onSubmit: onFormSubmit,
    validationSchema: schema,
  });

  const passwordRequirements: IPasswordRequirement[] = [
    {
      name: "length",
      regex: lengthRegex,
      text: strings.pageIndexRegisterPasswordLength,
    },
    {
      name: "uppercase",
      regex: uppercaseRegex,
      text: strings.pageIndexRegisterPasswordUpperCase,
    },
    {
      name: "lowercase",
      regex: lowercaseRegex,
      text: strings.pageIndexRegisterPasswordLowerCase,
    },
    {
      name: "number",
      regex: digitRegex,
      text: strings.pageIndexRegisterPasswordNumber,
    },
    {
      name: "special",
      regex: specialRegex,
      text: strings.pageIndexRegisterPasswordSpecial,
    },
  ];

  function getValid(regex: RegExp) {
    if (values.password.length === 0) {
      return null;
    }
    return regex.test(values.password);
  }

  function getIcon(valid: boolean | null) {
    if (valid === null) {
      return faCheckCircle;
    }
    return valid ? faCheckCircle : faXmarkCircle;
  }

  function getTextClass(valid: boolean | null) {
    if (valid === null) {
      return null;
    }
    return valid ? "text-success" : "text-danger";
  }

  function renderPasswordRequirement(passwordRequirement: IPasswordRequirement) {
    const valid = getValid(passwordRequirement.regex);
    const icon = getIcon(valid);
    const textClass = getTextClass(valid);
    return (
      <Form.Text className={classNames("d-block", textClass)} key={passwordRequirement.name}>
        <FontAwesomeIcon className="me-1" icon={icon} />
        {passwordRequirement.text}
      </Form.Text>
    );
  }

  function renderPasswordRequirements() {
    return passwordRequirements.map(renderPasswordRequirement);
  }

  return (
    <>
      <Card bg="dark" className={classNames("my-5", styles.loginContainer)}>
        <Card.Body>
          <Card.Title className="text-secondary">{strings.pageIndexRegisterTitle}</Card.Title>
          <Card.Text>{strings.pageIndexRegisterText}</Card.Text>
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
                placeholder={strings.pageIndexRegisterPasswordPlaceholder}
                name="password"
                isInvalid={(!!touched.password || submitCount > 0) && !!errors.password}
                onChange={handleChange}
                value={values.password}
              />
              <Form.Control.Feedback type="invalid">
                {(!!touched.password || submitCount > 0) && !!errors.password && errors.password}
              </Form.Control.Feedback>
              {renderPasswordRequirements()}
            </Form.Group>

            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Control
                type="password"
                className="bg-light text-dark"
                placeholder={strings.pageIndexRegisterConfirmPasswordPlaceholder}
                name="confirmPassword"
                isInvalid={(!!touched.confirmPassword || submitCount > 0) && !!errors.confirmPassword}
                onChange={handleChange}
                value={values.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {(!!touched.confirmPassword || submitCount > 0) && !!errors.confirmPassword && errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex flex-row justify-content-between">
              <Button variant="outline-secondary" onClick={onBackClick}>
                {strings.back}
              </Button>

              {submitting ? (
                <Button className="flex-fill ms-3" variant="primary" disabled>
                  <LoadingSpinner size="sm" />
                </Button>
              ) : (
                <Button className="flex-fill ms-3" type="submit">
                  {strings.pageIndexRegisterSubmit}
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <ErrorModal error={error} onHide={onHideError} />
    </>
  );
}
