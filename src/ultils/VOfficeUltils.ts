import strings from "../strings";
import { getMessageAttachmentByID_2 } from "../helpers/sso-helper";
import { VParseToHTMLFormat, VReplaceImageInline } from "./VUltils";

export function VOJS_Get_Recipient(item: any): Promise<any> {
  return new Promise((resolve, reject) => {

    item.to.getAsync(function (asyncResult) {
      var recipients = [];

      if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
        asyncResult.value.map((item) => recipients.push(item.emailAddress));

        item.cc.getAsync(function (asyncResult) {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            asyncResult.value.map((item) => recipients.push(item.emailAddress));

            item.bcc.getAsync(function (asyncResult) {
              if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                asyncResult.value.map((item) => recipients.push(item.emailAddress));

                console.log("recipients", recipients);
                resolve(recipients);
              } else reject(asyncResult.error);
            });
          } else reject(asyncResult.error);
        });
      } else reject(asyncResult.error);
    });
  });
}

export async function VOJS_Get_Attachments(item: any): Promise<any> {
  let attachments = [];

  // Get all attachment
  const attItems: any = await new Promise((resolve, reject) =>
    item.getAttachmentsAsync({ asyncContext: { currentItem: item } }, (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) reject(result.error.message);
      else resolve(result.value);
    })
  );

  // If has attachment -> find the attachment with property isInline = false
  for (let i = 0; i < attItems?.length; i++) {
    if (!attItems?.[i].isInline) {
      const attItem: any = await new Promise((resolve, reject) =>
        item.getAttachmentContentAsync(attItems?.[i].id, async (result) => {
          if (result.status !== Office.AsyncResultStatus.Succeeded) resolve(result.value);
          else resolve(result.value);
        })
      );
      const attachment = { name: attItems?.[i].name, content: attItem?.content };
      attachments.push(attachment);
    }
  }

  return attachments;
}

export function VOJS_Get_Subject(item: any): Promise<string> {
  return new Promise((resolve, reject) => {
    item.subject.getAsync((result) => {
      // if error -> return promise the error
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        reject(result.error.message);
      }
      // if success -> return promise the value of subject
      else {
        resolve(result.value);
      }
    });
  });
}

export function VOJS_Get_HTMLBody(item: any): Promise<string> {
  return new Promise((resolve, reject) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(strings.serverErrorOccurred));
        }, 60000);
      });
    
      item.body.getAsync(
      Office.CoercionType.Html,
        { asyncContext: "This is passed to the callback" },
        function callback(resultbody) {
          // parse the value of current HTML body from string to HTML format
          let bodyDiv = VParseToHTMLFormat(resultbody.value);

          // save item email for call rest api
          saveItem(bodyDiv, item).then((data) => {
            resolve(data);
          }).catch((err) => {      
            reject(err);
          });

          Promise.race([timeoutPromise, saveItem(bodyDiv, item)])
            .then((data) => {
              // If data is received before timeout, resolve the main promise
              resolve(data.toString());
            }).catch((error) => {
              // If either fetch or timeout fails, reject the main promise
              reject(error);
            });
        }
      );
    });
}

var countNumber = 0;
function saveItem(bodyDiv: Document, item:any): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("Starting save item...");
    item.saveAsync(async function callback(result) {
      console.log("Save item result:", result);
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        console.error("Error saving item:", result.error.message);
        if (countNumber >= 5) {
          reject(new Error(strings.serverErrorOccurred));
          return;
        }
      } else {
        if (!result || !result.value) {
          countNumber+=1;
          console.log("Result is null or empty, calling saveAsync again...");
          saveItem(bodyDiv, item);
          return;
        }

        var myNewItemSaved = result.value;
        var itemId = "";

        // set item id
        // 1. Platform macOS: item get default
        // 2. Another platform: need to convert to RestId
        if (Office.context.mailbox.diagnostics.hostName === "OutlookIOS") itemId = myNewItemSaved;
        else itemId = VOJS_ConvertToRestId(myNewItemSaved)

        try {
          let messageAttachment = await getMessageAttachmentByID_2(itemId);
          // Handle the image inline
          VReplaceImageInline(messageAttachment.value, bodyDiv)
            .then((data) => {
              console.log("Replace image inline result:", data);
              resolve(data);
            })
            .catch((err) => {
              console.error("Error replacing image inline:", err);
              reject(err);
            });
        } catch (error) {
          console.error("Error fetching message attachment:", error);
        }
      }
    });
  });
}
  
export function VOJS_ConvertToRestId(itemId: string): string {
  const messageID = Office.context.mailbox.convertToRestId(
      itemId,
      Office.MailboxEnums.RestVersion.v2_0
  );
  return messageID;
}

// Remove attachment
// If remove success resolve true. 
export const VOJS_RemoveAttachments = (item: any): Promise<any> => {
  const { Base64, Eml, ICalendar, Url } = Office.MailboxEnums.AttachmentContentFormat;

  return new Promise((resolve, reject) => {
    item.getAttachmentsAsync({ asyncContext: { currentItem: item } }, (result) => {
      // if result is error --> reject
      if (result.error) {
        reject(result.error);
        return;
      }

      const attachments = result.value;

      // If not have attachment -> return true -> end function
      if (attachments.length === 0) {
        resolve(true);
        return;
      }

      // get attachment with id and then using library of Office js for remove it
      const promises = attachments.map(({ id }) => {
        return new Promise((attachmentResolve) => {
          item.getAttachmentContentAsync(id, (res) => {
            switch (res.value.format) {
              // All of attachment is return base64String format.
              case Base64:
                // remove attachment
                removeAttachment(item, id)
                  .then((data: boolean) => attachmentResolve(data))
                  .catch((error) => attachmentResolve(error));
                break;
              case Eml:
              case ICalendar:
              case Url:
                attachmentResolve(false);
                break;
              default:
                attachmentResolve(false);
                break;
            }
          });
        });
      });

      Promise.all(promises)
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  });
};

// remove attachment item
const removeAttachment = (item, attachmentId) => {
  return new Promise((resolve, reject) => {
    item.removeAttachmentAsync(attachmentId, { asyncContext: null }, function (asyncResult) {
      if (asyncResult.status === Office.AsyncResultStatus.Failed) {
        reject(asyncResult.error);
      } else {
        resolve(true);
      }
    });
  });
};