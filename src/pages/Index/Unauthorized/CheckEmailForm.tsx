import * as yup from "yup";

import { useKeys } from "@ebi/hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";

import { accountExists } from "@ebi/api-client";
import { VUserExists } from "@ebi/protobuffers";
import classNames from "classnames";
import { useFormik } from "formik";
import { useController } from "rest-hooks";
import ErrorModal from "../../../components/ErrorModal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import strings from "../../../strings";
import styles from "./Unauthorized.module.scss";

interface FormFields {
  email: string;
}

const schema = yup.object().shape({
  email: yup.string().email("Must be a valid email address").required("Email is required"),
});

interface ICheckEmailFormProps {
  onSubmit: (response: VUserExists) => void;
}

export default function CheckEmailForm({ onSubmit }: ICheckEmailFormProps) {
  const initialValues: FormFields = useMemo(
    () => ({
      email: Office.context.mailbox?.userProfile.emailAddress,
    }),
    []
  );

  const { fetch } = useController();
  const keys = useKeys();

  const [element, setElement] = useState<HTMLInputElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (element === null) {
      return;
    }
    element.focus();
  }, [element]);

  useEffect(() => {
    setSubmitting(!keys.symmetricKey);
  }, [keys]);

  const onFormSubmit = useCallback(
    async ({ email }: FormFields) => {
      setError(null);
      setSubmitting(true);

      try {
        const response = await fetch(accountExists, {
          emails: [email],
          keys,
        });
        setSubmitting(false);

        const [userExist] = response.userExistList;
        onSubmit(userExist);
      } catch (err: unknown) {
        setSubmitting(false);
        if (err instanceof Error) {
          setError(err);
        }
      }
    },
    [fetch, keys, onSubmit]
  );

  const onHideError = useCallback(() => {
    setError(null);
  }, []);

  const { touched, errors, handleChange, handleSubmit, submitCount, values } = useFormik({
    initialValues,
    onSubmit: onFormSubmit,
    validationSchema: schema,
  });

  return (
    <>
      <Card bg="dark" className={classNames("my-5", styles.loginContainer)}>
        <Card.Body>
          <Card.Title className="text-secondary">{strings.pageIndexCheckEmailTitle}</Card.Title>
          <Card.Text>{strings.pageIndexCheckEmailText}</Card.Text>
          <Form className="d-flex flex-column" noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Control
                ref={setElement}
                type="email"
                className="bg-light text-dark"
                placeholder={strings.pageIndexCheckEmailPlaceholder}
                name="email"
                disabled
                autoComplete="off"
                isInvalid={(!!touched.email || submitCount > 0) && !!errors.email}
                onChange={handleChange}
                value={values.email}
              />
              <Form.Control.Feedback type="invalid">
                {(!!touched.email || submitCount > 0) && !!errors.email && errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            {submitting ? (
              <Button variant="primary" disabled>
                <LoadingSpinner size="sm" />
              </Button>
            ) : (
              <Button type="submit">{strings.pageIndexCheckEmailSubmit}</Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <ErrorModal error={error} onHide={onHideError} />
    </>
  );
}
