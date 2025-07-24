import { VDRM } from "@ebi/protobuffers";
import { Account } from "@ebi/hooks";

import { faClock, faCopy, faSave } from "@fortawesome/free-regular-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faPrint } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React from "react";
import UaParser from "ua-parser-js";

import packageJson from "../../package.json";
import { FileContentDBService } from "../dbServices/fileContentService";
import useDeviceId from "../hooks/useDeviceId";
import CustomTooltip from "../pages/CustomTooltip/CustomTooltip";

import { MacClient, MacClientSecret } from "../consts";
import strings from "../strings";

import { Forward } from "../assets/index";
import moment from "moment";

const fileContentDBService = new FileContentDBService();
export const dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

export function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function VColoredString(orgStr: string, strColoreds: string[], colorHex) {
  let result = orgStr;
  strColoreds.map((str) => {
    result = result.replace(str, `<span class="colored-text">${str}</span>`);
  });

  return (
    <div>
      <p dangerouslySetInnerHTML={{ __html: result }}></p>
      <style>
        {`
          .colored-text {
            color: #${colorHex};
          }
        `}
      </style>
    </div>
  );
}

export function VConcatArrays(a: Uint8Array, b: Uint8Array) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

export function VConfigApp() {
  const uaParser = new UaParser(window.navigator.userAgent);
  const deviceName = `${uaParser.getOS().name} ${uaParser.getBrowser().name}`;
  const deviceId = useDeviceId();

  return {
    apiUrl: process.env.REACT_APP_API_URL!,
    clientId: MacClient,
    clientSecret: MacClientSecret,
    deviceId,
    deviceName,
    deviceType: "web",
    deviceVersion: packageJson.version,
    identityProviderUrl: process.env.IDENTITY_PROVIDER_URL!,
    persistTokens: true,
  };
}

export async function VConvertAttToArrayBuffer() {
  while ((await fileContentDBService.getFileContentData()) === undefined) {
    await delay(500);
  }
  const fileBase64String = await fileContentDBService.getFileContentData();
  return VConvertBase64StringToArrayBuffer(fileBase64String);
}

export function VConvertBase64StringToArrayBuffer(base64String) {
  if (base64String) {
    const binaryString: string = atob(base64String);
    const bytes: Uint8Array = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  } else return null;
}

export function VDateReviver(key: any, value: any) {
  if (typeof value == "string" && dateRegex.exec(value)) {
    return new Date(value);
  }
  return value;
}

export function VFormatTime(inputTime) {
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  } as Intl.DateTimeFormatOptions;

  const date = new Date(inputTime);
  const formattedTime = new Intl.DateTimeFormat("en-US", options).format(date);
  return formattedTime;
}

export function VFormatTimeForDecrypt(dateTime) {
  const date = new Date(dateTime);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const day = days[date.getDay()];
  const month = date.getMonth() + 1;
  const dateOfMonth = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const amOrPm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

  const formattedTime = `${day} ${month}/${dateOfMonth}/${date.getUTCFullYear()} ${formattedHours}:${String(
    minutes
  ).padStart(2, "0")} ${amOrPm}`;

  return formattedTime;
}

export function VParseToHTMLFormat(htmlBody: string) {
  if (htmlBody) {
    const parser = new DOMParser();
    return parser.parseFromString(htmlBody, "text/html");
  } else return null;
}

export function VUint8ArrayToFile(uint8Array, fileName, mimeType) {
  const blob = new Blob([uint8Array], { type: mimeType });
  return new File([blob], fileName);
}

export function VSetHTMLBodyForEncrypt(htmlBody) {
  return `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40"><head></head><body lang="EN-US" link="#0563C1" vlink="#954F72" style='word-wrap:break-word'><div class="WordSection1">${htmlBody}</div></body></html>`;
}

export function VReplaceCommentHTML(HTMLString) {
  return HTMLString?.replace(/<!--[\s\S]*?-->/g, "").replace(/&lt;!--[\s\S]*?--&gt;/g, "");
}

export function VSizeBase64String(base64String) {
  let size = 0;
  if (base64String) {
    const base64Data = base64String.replace(/=*$/, "");
    size = 3 * (base64Data.length / 4);
  }
  return size;
}

interface IDRMTooltipsProps {
  drm: VDRM;
  drmForward: boolean;
  isAuthor: boolean;
  sunrise: Date;
  sunset: Date;
}
export function VRenderDRMTooltips(props: IDRMTooltipsProps) {
  const drm = props.drm;
  const drmForward = props.drmForward;
  const isAuthor = props.isAuthor;
  const sunrise = props.sunrise;
  const sunset = props.sunset;

  interface IDRMTooltips {
    name: string;
    header: string;
    permission: boolean;
    tooltipDesc: string;
    icon: any;
  }
  const drmTooltips: IDRMTooltips[] = [
    {
      name: "forward",
      header: strings.headerTooltipForward,
      permission: drmForward,
      tooltipDesc: isAuthor || drmForward ? strings.allowForward : strings.notAllowForward,
      icon: Forward,
      // onClick: onForwardEmail,
    },
    {
      name: "copy",
      header: strings.headerTooltipCopy,
      permission: drm?.allowCopy,
      tooltipDesc: isAuthor || drm?.allowCopy ? strings.allowCopy : strings.notAllowCopy,
      icon: faCopy,
      // onClick: copyContentEmail,
    },
    {
      name: "print",
      header: strings.headerTooltipPrint,
      permission: drm?.allowPrint,
      tooltipDesc: isAuthor || drm?.allowPrint ? strings.allowPrint : strings.notAllowPrint,
      icon: faPrint,
      // onClick: printEmail,
    },
    {
      name: "save",
      header: strings.headerTooltipSave,
      permission: drm?.allowSave,
      tooltipDesc: isAuthor || drm?.allowSave ? strings.allowSave : strings.notAllowSave,
      icon: faSave,
      // onClick: downloadEmail,
    },
    {
      name: "timeline",
      header: strings.headerTooltipTimeline,
      permission: isAllowedTime(sunrise, sunset),
      tooltipDesc: isAllowedTime(sunrise, sunset) ? strings.allowTimeline : strings.notAllowTimeline,
      icon: faClock,
      // onClick: null,
    },
    {
      name: "location",
      header: strings.headerTooltipLocation,
      permission: true,
      tooltipDesc: true ? strings.allowLocation : strings.notAllowLocation,
      icon: faGlobe,
      // onClick: null,
    },
  ];

  return (
    <>
      {drmTooltips.map((tooltip, i) => (
        <CustomTooltip header={tooltip.header} body={tooltip.tooltipDesc}>
          {tooltip.name === "forward" ? (
            <img
              key={i}
              style={{ opacity: props.drmForward || props.isAuthor ? 1 : 0.5 }}
              src={tooltip.icon}
              alt="forward"
            />
          ) : (
            <FontAwesomeIcon
              key={i}
              style={tooltip.permission || props.isAuthor ? { color: "#ffffff" } : { color: "#b3b3b0" }}
              icon={tooltip.icon}
            />
          )}
        </CustomTooltip>
      ))}
    </>
  );
}

function isAllowedTime(sunrise: Date | null, sunset: Date | null): boolean {
  if (sunrise == null && sunset == null) {
    return true;
  }

  if (sunrise != null && sunset == null) {
    return moment(new Date()).isAfter(moment(sunrise));
  }

  if (sunrise == null && sunset != null) {
    return moment(new Date()).isBefore(moment(sunset));
  }

  return moment(new Date()).isBetween(moment(sunrise), moment(sunset));
}

export function VInitials(name) {
  return name.substring(0, 2).toUpperCase();
}

export function VRemoveTags(htmlString) {
  return htmlString.replace(/<\/?[^>]+(>|$)|&nbsp;/g, "");
}

export function VReplaceImageInline(allImages: any, bodyDiv: Document): Promise<string> {
  return new Promise(async (resolve, reject) => {
    var isDesktop = false;
    var imgSrcId = bodyDiv.getElementsByTagName("img")[0]?.getAttribute("src");
    var arrContentBytes = [];
    var listMsoSmartlink = bodyDiv.getElementsByClassName("MsoSmartlink");

    for (var i = 0; i < listMsoSmartlink.length; i++) {
      if (listMsoSmartlink[i].getElementsByTagName("img").length > 0) {
        const src = listMsoSmartlink[i].getElementsByTagName("img")[0].getAttribute("src");
        arrContentBytes.push(src.substring(src.indexOf("base64") + 7, src.length));
      }
    }

    if (imgSrcId === undefined) {
      resolve(VSetHTMLBodyForEncrypt(new XMLSerializer().serializeToString(bodyDiv)));
    }

    if (imgSrcId.indexOf("cid") != -1) isDesktop = true;

    let finalImages = [];
    for (var i = 0; i < allImages.length; i++) {
      if (allImages[i].isInline) {
        const arrNotIncludeImages = arrContentBytes.filter(
          (contentBytes) => contentBytes === allImages[i].contentBytes
        );
        arrNotIncludeImages.length == 0 && finalImages.push(allImages[i]);
      }
    }

    var totalSizeOfImages = 0;
    for (var i = 0; i < finalImages.length; i++) {
      totalSizeOfImages = totalSizeOfImages + finalImages[i].size;
      if (bodyDiv.getElementsByTagName("img")[i].getAttribute("src").indexOf("base64") != -1) continue;

      if (isDesktop) imgSrcId = bodyDiv.getElementsByTagName("img")[i].getAttribute("src");
      else imgSrcId = bodyDiv.getElementsByTagName("img")[i].getAttribute("originalsrc");

      imgSrcId = imgSrcId.substring(4, imgSrcId.length);
      var wantedImg = finalImages.filter((img) => img.contentId === imgSrcId)[0];

      bodyDiv.getElementsByTagName("img")[i].src =
        "data:" + wantedImg?.contentType + ";base64," + wantedImg.contentBytes;
    }

    resolve(VSetHTMLBodyForEncrypt(new XMLSerializer().serializeToString(bodyDiv)));
  });
}

export function VDecreaseByOneMinute(dateInput: string) {
  // Parse the input string into separate date and time components
  var [datePart, timePart] = dateInput.split("T");
  // Parse the time part into hours and minutes
  var [hours, minutes] = timePart.split(":").map(Number);
  // Decrease the minutes
  minutes -= 1;
  // If minutes become negative, adjust hours and reset minutes to 59
  if (minutes < 0) {
    hours -= 1;
    minutes = 59;
  }

  // Format the adjusted time
  var adjustedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  // Combine date part and adjusted time
  var decreasedDateStr = `${datePart}T${adjustedTime}`;

  return decreasedDateStr;
}

export function VConvertTimeToUTC(timeInput: string) {
  // Correct the input format
  timeInput = timeInput.replace(" at ", ",");
  // Convert to Date object
  let dateObject = new Date(timeInput);
  // Get the UTC time in milliseconds
  let utcTime = dateObject.getTime();
  // Create a new Date object for UTC time
  let utcTimeDateObject = new Date(utcTime);
  // Format to "YYYY-MM-DDTHH:mm" (ISO 8601)
  let formattedTime = utcTimeDateObject.toISOString().slice(0, 16);
  return formattedTime;
}

interface IAccountExpired {
  authDefault: any;
  isExpired: boolean;
}
export function VCheckIsExpired(account: Account) {
  const auth = JSON.parse(localStorage.getItem("auth-tokens") || "[]");
  const authDefault = auth?.filter((auth) => auth.email === account.email) || [];
  const isExpired = authDefault.length > 0 ? moment().isAfter(moment.utc(authDefault[0]?.expiration)) : true;

  let result: IAccountExpired = {
    authDefault: authDefault || [],
    isExpired: isExpired,
  };

  return result;
}
