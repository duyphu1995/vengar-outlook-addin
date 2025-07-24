import React, { useCallback, useContext, useState } from "react";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";

import classNames from "classnames";
import moment, { Moment } from "moment";
import { Form } from "react-bootstrap";
import DatePicker from "react-date-picker";
import { TimePicker } from "react-tempusdominus-bootstrap";
import FooterWithBack from "../../../components/Footer/Footer";

import strings from "../../../strings";
import Context from "../Context";
import defaultStyles from "./When.module.scss";

interface TimeDefinitionProps {
  defaultOptionTitle: string;
  selectOptionTitle: string;
  setter: React.Dispatch<React.SetStateAction<Date | null>>;
  title: string;
  value: Date | null;
  styles: any;
}

interface TimeDefinitionWithKey extends TimeDefinitionProps {
  key: string;
}

function TimeDefinition({ defaultOptionTitle, selectOptionTitle, setter, title, value, styles }: TimeDefinitionProps) {
  const onResetClick = useCallback(() => {
    setter(null);
  }, [setter]);

  const onSetClick = useCallback(() => {
    if (value) {
      return;
    }
    setter(new Date());
  }, [setter, value]);

  const onDateChange = useCallback(
    (date: Date) => {
      const m = moment(value).year(date.getFullYear()).month(date.getMonth()).date(date.getDate());
      setter(m.toDate());
    },
    [setter, value]
  );

  const onTimeChange = useCallback(
    ({ date }: { date: Moment }) => {
      const m = moment(value).hours(date.hours()).minutes(date.minutes());
      setter(m.toDate());
    },
    [setter, value]
  );

  const [showDatepicker, setShowDatepicker] = useState(false);

  return (
    <div className={styles.timeSelect}>
      <h6>{title}</h6>
      <button
        type="button"
        className={classNames(styles.timeSelectOption, {
          [styles.timeSelectOptionActive]: value === null,
        })}
        onClick={onResetClick}
      >
        <div className={styles.timeSelectOptionTitle}>{defaultOptionTitle}</div>
      </button>
      <button
        type="button"
        className={classNames(styles.timeSelectOption, {
          [styles.timeSelectOptionActive]: value !== null,
        })}
        onClick={onSetClick}
      >
        <div className={styles.timeSelectOptionTitle}>{selectOptionTitle}</div>
      </button>
      {value !== null ? (
        <div className={styles.dateTimeSelect}>
          <Form.Group className={styles.inputGroup} as="div" controlId="sunrise-date">
            <div
              className="form-control datetimepicker-input"
              style={{ width: "max-content" }}
              onClick={() => setShowDatepicker(!showDatepicker)}
            >
              {moment(value).format("MMMM DD, YYYY")}
            </div>
            <DatePicker
              calendarIcon={null}
              clearIcon={null}
              onChange={onDateChange}
              value={value}
              locale="en-US"
              className={styles.datepicker}
              isOpen={showDatepicker}
              onCalendarClose={() => setShowDatepicker(false)}
            />
          </Form.Group>
          <Form.Group
            className={styles.inputGroup}
            as="div"
            controlId="sunrise-time"
            onKeyDown={(e) => e.preventDefault()}
          >
            <TimePicker
              key={moment(value).format("MM/DD/YYYY")}
              className={styles.input}
              date={value}
              noIcon
              onChange={onTimeChange}
            />
          </Form.Group>
        </div>
      ) : null}
    </div>
  );
}

export interface WhenProps {
  styles?: any;
  onGoBack: () => void;
  onSave: (sunrise: Date, sunset: Date) => void;
}

export default function When(props: WhenProps) {
  const styles = props.styles || defaultStyles;
  const { onGoBack, onSave } = props;

  const { sunrise, sunset } = useContext(Context);

  const [tempSunrise, setTempSunrise] = useState<Date>(sunrise);
  const [tempSunset, setTempSunset] = useState<Date>(sunset);

  const timeDefinitions: TimeDefinitionWithKey[] = [
    {
      defaultOptionTitle: strings.pageSecureWhenDefaultSunrise,
      key: "sunrise",
      selectOptionTitle: strings.pageSecureWhenSelectSunrise,
      setter: setTempSunrise,
      title: strings.pageSecureWhenSunriseTitle,
      value: tempSunrise,
      styles: styles,
    },
    {
      defaultOptionTitle: strings.pageSecureWhenDefaultSunset,
      key: "sunset",
      selectOptionTitle: strings.pageSecureWhenSelectSunset,
      setter: setTempSunset,
      title: strings.pageSecureWhenSunsetTitle,
      value: tempSunset,
      styles: styles,
    },
  ];

  const handleSaveWhen = () => {
    onSave(tempSunrise, tempSunset);
  };

  function renderTimeSelects() {
    return (
      <div className={styles.timeSelectContainer}>
        {timeDefinitions.map((timeDefinition) => (
          <TimeDefinition
            key={timeDefinition.key}
            defaultOptionTitle={timeDefinition.defaultOptionTitle}
            selectOptionTitle={timeDefinition.selectOptionTitle}
            setter={timeDefinition.setter}
            title={timeDefinition.title}
            value={timeDefinition.value}
            styles={timeDefinition.styles}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={classNames(styles.whenContainer, "when-page")}>
      <div className={styles.whenContainer}>
        <div className={styles.whenSelect}>
          <h5>{strings.pageSecureWhenTitle}</h5>
          <p className={styles.whenSubtitle}>{strings.pageSecureWhenDescription}</p>
        </div>

        <div className={styles.borderBottom}></div>

        <div className={styles.whenSelect}>{renderTimeSelects()}</div>
      </div>
      <div className={styles.footer}>
        <FooterWithBack onBack={onGoBack} onSave={handleSaveWhen} />
      </div>
    </div>
  );
}
