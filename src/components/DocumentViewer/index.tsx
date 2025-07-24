import React from 'react';
import renderers from './DocumentRenderers';

interface IDocumentViewerProps {
  className?: string | undefined;
  fileData: Uint8Array;
  fileName: string;
}

export default function DocumentViewer({
  className,
  fileData,
  fileName
}: IDocumentViewerProps) {
  const fileType = fileName.split('.').pop();

  function renderNoRenderer() {
    return <>Blah blah</>;
  }

  if (!fileType) {
    return renderNoRenderer();
  }

  const renderer = renderers.find((r) => r.fileTypes.includes(fileType));
  const content = renderer
    ? renderer({ fileData, fileName })
    : renderNoRenderer();

  return <div className={className}>{content}</div>;
}
