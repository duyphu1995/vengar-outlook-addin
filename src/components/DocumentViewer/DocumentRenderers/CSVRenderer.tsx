import React, { useEffect, useRef, useState } from 'react';

import CSV from 'comma-separated-values';
import { IDocumentRendererProps } from './types';
import dataGrid from 'canvas-datagrid';

export default function CSVRenderer({ fileData }: IDocumentRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fileData) {
      return;
    }
    const grid = dataGrid({
      parentNode: ref.current
    });
    const decoder = new TextDecoder();
    const text = decoder.decode(fileData);
    const csv = new CSV(text);
    const data = csv.parse();
    grid.data = data;
  }, [fileData]);

  return <div ref={ref} />;
}
CSVRenderer.fileTypes = ['csv'];
