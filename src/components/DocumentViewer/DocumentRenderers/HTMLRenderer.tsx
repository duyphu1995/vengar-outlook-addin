import React, { useEffect, useRef } from 'react';

import { IDocumentRendererProps } from './types';
import styles from './DocumentRenderers.module.scss';

export default function HTMLRenderer({ fileData }: IDocumentRendererProps) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!fileData) {
      return;
    }
    if (!ref.current?.contentWindow) {
      return;
    }

    const decoder = new TextDecoder();
    const text = decoder.decode(fileData);

    const doc = ref.current.contentWindow.document;
    doc.open();
    doc.write(text);
    doc.close();
    doc.onselectstart = (event) => {
      event.preventDefault();
    };
    // const src = `data:text/html;charset=utf-8,${text}`;
  }, [fileData]);

  return <iframe className={styles.html} ref={ref} />;
}
HTMLRenderer.fileTypes = ['htm', 'html'];
