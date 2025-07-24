import React from "react";

import AsyncBoundary from "../../components/AsyncBoundary";
import Decryption from "../../components/Decryption";
import LoadingSpinner from "../../components/LoadingSpinner";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";

import { VExt } from "../../consts";
import { FileContentDBService } from "../../dbServices/fileContentService";
import strings from "../../strings";
import { getMessageByID } from "../../helpers/sso-helper";
import { VOJS_ConvertToRestId } from "../../ultils/VOfficeUltils";

const fileContentDBService = new FileContentDBService();

Office.initialize = function (reason) {
  console.log("Office is initialized!");
  console.log("reason", reason);
};

Office.onReady(async () => {
  console.log("Office is ready!");

  // Event Item Changed: if the task pane can be pinned -> when clicking on a different email -> update the mail item and call the function "onGetAttachment" again
  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, itemChanged);
  updateTaskpaneUI(Office.context.mailbox.item);
});

function renderLoading() {
  return <LoadingSpinner page="decrypt" />;
}

function itemChanged(eventArgs) {
  console.log("Another email message selected");
  updateTaskpaneUI(Office.context.mailbox.item);
}

async function updateTaskpaneUI(item) {
  if (item != null) console.log(item.subject);
  await onGetAttachment();
}

const onGetAttachment = async () => {
  const { item } = Office.context.mailbox;
  const attachments: Office.AttachmentDetails[] = item.attachments;

  // if not have attachment exit function
  if (attachments.length <= 0) {
    throw new Error(strings.errorTheEmailHasNoAttachment);
  } else {
    const attachment = attachments.filter((att) => !att.isInline && att.name.includes(VExt)); // find the attachment not inline and extension is .vgar
    if (attachment.length > 0) {
      localStorage.setItem(strings.itemID, VOJS_ConvertToRestId(item.itemId)); // set local storage for item id
      localStorage.setItem(strings.attachmentName, attachment[0].name); // set local storage for attachment name
      item.getAttachmentContentAsync(attachment[0].id, handleAttachmentsCallback);
    } else {
      throw new Error(strings.errorTheEmailHasNoAttachment);
    }
  }
};

// Save the content file to
const handleAttachmentsCallback = async (result) => {
  const fileBase64String: string = result.value.content;
  await fileContentDBService.saveFileContentData(fileBase64String).then(async () => {
    await getCurrentMessage();
  });
};

async function getCurrentMessage() {
  const messageID = VOJS_ConvertToRestId(Office.context.mailbox.item.itemId);
  await getMessageByID(process_get_message_by_id, messageID);
}

function process_get_message_by_id(result: Object) {
  localStorage.setItem(strings.LS_MAIL_ITEM, JSON.stringify(result));
}

export default function DecryptWithSuspense() {
  return (
    <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={renderLoading}>
      <Decryption onGetAttachment={onGetAttachment} />
    </AsyncBoundary>
  );
}
