import { GeoCountryResource } from "@ebi/api-client";
import { faCircleXmark, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { useResource } from "rest-hooks";
import strings from "../../../strings";
import styles from "./ConfirmModalItems.module.scss";

interface IListItemProps {
  children: React.ReactNode;
}

function ListItem({ children }: IListItemProps) {
  return <div className={classNames("d-flex align-items-center", styles.listItem)}>{children}</div>;
}

interface IPermissionProps {
  allowed: boolean;
}

function Permission({ allowed }: IPermissionProps) {
  return <FontAwesomeIcon color={allowed ? "#46d9a4" : "#f0395a"} icon={allowed ? faThumbsUp : faCircleXmark} />;
}

interface IHowProps {
  allowForward: boolean;
  allowCopy: boolean;
  allowPrint: boolean;
  allowSave: boolean;
}

export function How({ allowForward, allowCopy, allowPrint, allowSave }: IHowProps) {
  const drmItems = [
    {
      allowed: !allowForward,
      name: "Forward",
      description: "forwarded",
    },
    {
      allowed: !allowCopy,
      name: "Copy",
      description: "copied",
    },
    {
      allowed: !allowPrint,
      name: "Print",
      description: "printed",
    },
    {
      allowed: !allowSave,
      name: "Save",
      description: "saved",
    },
  ];

  return (
    <>
      {drmItems.map((item, i) => (
        <ListItem key={i}>
          <Permission allowed={item.allowed} />
          <span
            className={classNames(
              styles.listItemText,
              styles.listItemLabel,
              item.allowed ? null : styles.listItemTextNotAllow
            )}
          >
            {item.name}
          </span>
          <span className={classNames(styles.listItemText, item.allowed ? null : styles.listItemTextNotAllow)}>
            Files {item.allowed ? "can" : "cannot"} be {item.description}.
          </span>
        </ListItem>
      ))}
    </>
  );
}

interface IWhereProps {
  blocked: number[];
}

export function Where({ blocked }: IWhereProps) {
  const countries = useResource(GeoCountryResource.list(), {});

  if (blocked.length === 0) {
    return (
      <ListItem>
        <Permission allowed />
        <span className={classNames(styles.listItemText)}>{strings.modalEveryWhere}</span>
      </ListItem>
    );
  }
  if (blocked.length === countries.length) {
    return (
      <ListItem>
        <Permission allowed={false} />
        <span className={classNames(styles.listItemText)}>{strings.modalEveryWhere}</span>
      </ListItem>
    );
  }

  const allowCountries = countries.filter((c) => !blocked.includes(c.id));
  const ratio = allowCountries.length / countries.length;
  const countryNames = [];

  if (ratio < 0.5) {
    allowCountries.map((ct) => {
      const country = countries.find((c) => c.id === ct.id);
      countryNames.push(country?.name);
    });

    return (
      <>
        <ListItem>
          <Permission allowed />
          <span className={classNames(styles.listItemText)}>{countryNames.map((s) => s).join(", ")}</span>
        </ListItem>
        <ListItem>
          <Permission allowed={false} />
          <span className={classNames(styles.listItemText, styles.listItemTextNotAllow)}>
            {strings.modalEveryWhereElse}
          </span>
        </ListItem>
      </>
    );
  } else {
    countries.map((ct) => {
      if (blocked.includes(ct.id)) {
        const country = countries.find((c) => c.id === ct.id);
        countryNames.push(country?.name);
      }
    });

    return (
      <>
        <ListItem>
          <Permission allowed />
          <span className={classNames(styles.listItemText, styles.listItemTextNotAllow)}>
            {strings.modalEveryWhereElse}
          </span>
        </ListItem>
        <ListItem>
          <Permission allowed={false} />
          <span className={classNames(styles.listItemText)}>{countryNames.map((s) => s).join(", ")}</span>
        </ListItem>
      </>
    );
  }
}
