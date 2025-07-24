import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { GeoCountryResource } from "@ebi/api-client";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { Form } from "react-bootstrap";
import { useResource } from "rest-hooks";

import AsyncBoundary from "../../../components/AsyncBoundary";
import FooterWithBack from "../../../components/Footer/Footer";
import LoadingSpinner from "../../../components/LoadingSpinner";
import NetworkErrorMessage from "../../../components/NetworkErrorMessage";

import strings from "../../../strings";
import Context from "../Context";
import defaultStyles from "./Where.module.scss";

type Filter = "all" | "excluded" | "included";

interface FilterDefinition {
  label: string;
  name: string;
  value: Filter;
}

function Loading() {
  return <LoadingSpinner page="where" />;
}

let countriesBlock: number[] = [];

function sortBy(a: Pick<GeoCountryResource, "name">, b: Pick<GeoCountryResource, "name">) {
  if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  }
  if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  }
  return 0;
}

function GeoCountryList() {
  const styles = defaultStyles;

  const { countries: blocked } = useContext(Context);
  const [tempBlocked, setTempBlocked] = useState<number[]>(blocked);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const ref = useRef(null);

  const countries = useResource(GeoCountryResource.list(), {});

  const areAllAllowed = tempBlocked.length === 0;
  const filtered = countries
    .slice(0)
    .filter((country) => {
      if (search) {
        return country.name.toLowerCase().startsWith(search.toLowerCase());
      }
      return true;
    })
    .filter((country) => {
      const isBlocked = tempBlocked.includes(country.id);
      if (filter === "excluded") {
        return isBlocked;
      }
      if (filter === "included") {
        return !isBlocked;
      }
      return true;
    });
  filtered.sort(sortBy);

  useEffect(() => {
    if (ref.current) {
      (ref.current as HTMLInputElement).focus();
    }
  }, []);

  const onSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    [setSearch]
  );

  const onClickFilter = useCallback((f: Filter) => {
    setFilter(f);
  }, []);

  const onToggleAllClick = useCallback(() => {
    if (areAllAllowed) {
      countriesBlock = countries.map((c) => c.id);
      setTempBlocked(countries.map((c) => c.id));
    } else {
      countriesBlock = [];
      setTempBlocked([]);
    }
  }, [areAllAllowed, countries]);

  const onToggleCountry = useCallback(
    (country: GeoCountryResource) => {
      const updated = tempBlocked.slice(0);
      const index = updated.indexOf(country.id);
      if (index >= 0) {
        updated.splice(index, 1);
      } else {
        updated.push(country.id);
      }
      countriesBlock = updated;
      setTempBlocked(updated);
    },
    [tempBlocked]
  );

  const filters: FilterDefinition[] = [
    { label: strings.pageSecureWhereFilterAll, name: "all", value: "all" },
    {
      label: strings.pageSecureWhereFilterIncluded,
      name: "included",
      value: "included",
    },
    {
      label: strings.pageSecureWhereFilterExcluded,
      name: "excluded",
      value: "excluded",
    },
  ];

  function renderCountry(country: GeoCountryResource) {
    const isBlocked = tempBlocked.includes(country.id);
    return (
      <div key={country.id} className={styles.country}>
        <div className={classNames("form-check", "form-switch", styles.switchContainer)}>
          <input
            className={classNames("form-check-input", "success", styles.switch)}
            type="checkbox"
            role="switch"
            checked={!isBlocked}
            onChange={() => onToggleCountry(country)}
          />
        </div>
        {country.name}
      </div>
    );
  }

  function renderCountries() {
    return <div className={styles.countryList}>{filtered.map(renderCountry)}</div>;
  }

  return (
    <div className={styles.countriesContainer}>
      <div className={classNames(styles.searchContainer)}>
        <Form.Control
          ref={ref}
          className={styles.search}
          type="text"
          placeholder={strings.pageSecureWhereSearchPlaceholder}
          value={search}
          onChange={onSearchChange}
        />
        <FontAwesomeIcon className={styles.searchIcon} icon={faMagnifyingGlass} />
      </div>
      <div className={classNames(styles.borderBottom, styles.filterContainer)}>
        <span>{strings.pageSecureWhereFilterLabel}</span>

        {filters.map(({ label, name, value }) => (
          <button
            key={name}
            type="button"
            style={name === "all" ? { marginLeft: 10, marginRight: 10 } : {}}
            className={classNames(styles.filter, {
              [styles.filterActive]: value === filter,
            })}
            onClick={() => onClickFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.countryAll}>
        <div className={classNames("form-check", "form-switch", styles.switchContainer)}>
          <input
            className={classNames("form-check-input", "success", styles.switch)}
            type="checkbox"
            role="switch"
            checked={areAllAllowed}
            onChange={onToggleAllClick}
          />
        </div>
        {strings.pageSecureWhereToggleAllLabel}
      </div>
      <div
        className={classNames(
          styles.countryContainer,
          filtered !== null && filtered.length > 0 ? styles.countryContainerHasData : ""
        )}
      >
        {renderCountries()}
      </div>
    </div>
  );
}

export interface WhereProps {
  styles?: any;
  onGoBack: () => void;
  onSave: (blocked: number[]) => void;
}

export default function Where(props: WhereProps) {
  const styles = props.styles || defaultStyles;
  const { onGoBack, onSave } = props;

  const handleSaveWhen = () => {
    onSave(countriesBlock);
  };

  return (
    <div className={styles.whereContainer}>
      <div className={styles.whereContainerDetail}>
        <div className={styles.whereTitleDecs}>
          <h5>{strings.pageSecureWhereTitle}</h5>
          <p className={styles.whereSubtitle}>{strings.pageSecureWhereDescription}</p>
        </div>

        <div className={styles.borderBottom}></div>

        <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={Loading}>
          <GeoCountryList />
        </AsyncBoundary>
      </div>

      <div className={classNames(styles.footer)}>
        <FooterWithBack onBack={onGoBack} onSave={handleSaveWhen} />
      </div>
    </div>
  );
}
