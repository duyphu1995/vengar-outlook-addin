import React, { useEffect, useRef } from "react";

import WebViewer from "@pdftron/webviewer";
import { ApryseLicenseKey } from "../../../consts";
import styles from "./DocumentRenderers.module.scss";
import { IDocumentRendererProps } from "./types";

export default function ApryseRenderer({ fileData, fileName }: IDocumentRendererProps) {
  const viewer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewer.current) {
      return;
    }

    WebViewer(
      {
        forceClientSideInit: true,
        fullAPI: true,
        licenseKey: ApryseLicenseKey,
        path: "webviewer",
      },
      viewer.current
    )
      .then((instance) => {
        var FitMode = instance.UI.FitMode;
        const blob = new Blob([fileData]);
        instance.UI.setFitMode(FitMode.FitWidth);
        instance.UI.loadDocument(blob, { filename: fileName });
        instance.UI.enableFeatures([instance.UI.Feature.Download, instance.UI.Feature.Print]);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          console.log(err);
        }
      });
  }, [fileData, fileName]);

  return <div ref={viewer} className={styles.apryse} />;
}
ApryseRenderer.fileTypes = [
  "bmp",
  "doc",
  "docx",
  "gif",
  "jfif",
  "jpeg",
  "jpg",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "tiff",
  "xls",
  "xlsx",
  // // audio
  // 'mp3',
  // 'wav',
  // 'ogg',
  // 'flac',
  // // video
  // 'mp4',
  // 'ogg',
  // 'webm'
];
