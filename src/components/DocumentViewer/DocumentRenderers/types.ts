import { FC } from 'react';

export interface IDocumentRendererProps {
  fileData: Uint8Array;
  fileName: string;
}

export interface IDocumentRenderer extends FC<IDocumentRendererProps> {
  fileTypes: string[];
}
