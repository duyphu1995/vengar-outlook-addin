import React, { Dispatch, SetStateAction } from 'react';

export interface Attachment {
  name: string;
  content: string;
}

export type Dialog = "confirm-cancel" | "confirm-encrypt";
export type ActionEmail = 'reply' | 'forward';

interface ContextProps {
  allowForward: boolean;
  allowCopy: boolean;
  allowPrint: boolean;
  allowSave: boolean;
  completedFilesBytes: Uint8Array,
  countries: number[];
  dialog?: Dialog;
  enableDecryptReceipts: boolean;
  error: Error;
  isLogin: boolean;
  templateEB: string,
  setAllowForward: Dispatch<SetStateAction<boolean>>;
  setAllowCopy: Dispatch<SetStateAction<boolean>>;
  setAllowPrint: Dispatch<SetStateAction<boolean>>;
  setAllowSave: Dispatch<SetStateAction<boolean>>;
  setCompletedFilesBytes: Dispatch<SetStateAction<Uint8Array>>;
  setCountries: Dispatch<SetStateAction<number[]>>;
  setDialog?: Dispatch<SetStateAction<Dialog | null>>;
  setEnableDecryptReceipts: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error>>;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setSunrise: Dispatch<SetStateAction<Date | null>>;
  setSunset: Dispatch<SetStateAction<Date | null>>;
  setTemplateEB: Dispatch<SetStateAction<string>>;
  submitting: boolean;
  sunrise: Date | null;
  sunset: Date | null;
}

const defaultProps: ContextProps = {
  allowForward: false,
  allowCopy: false,
  allowPrint: false,
  allowSave: false,
  completedFilesBytes: Uint8Array[4],
  countries: [],
  dialog: null,
  enableDecryptReceipts: false,
  error: null,
  isLogin: false,
  templateEB: '',
  setAllowForward: () => { },
  setAllowCopy: () => { },
  setAllowPrint: () => { },
  setAllowSave: () => { },
  setCompletedFilesBytes: () => { },
  setCountries: () => { },
  setDialog: () => { },
  setEnableDecryptReceipts: () => { },
  setError: () => { },
  setIsLogin: () => { },
  setSubmitting: () => { },
  setSunrise: () => { },
  setSunset: () => { },
  setTemplateEB: () => { },
  submitting: false,
  sunrise: null,
  sunset: null,
};

export default React.createContext(defaultProps);
